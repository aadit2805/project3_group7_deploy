import { Request, Response } from 'express';
import pool from '../config/db';

interface BestSellingItem {
  menu_item_id: number;
  name: string;
  item_type: string;
  total_quantity_sold: number;
  total_revenue: number;
  average_price: number;
  upcharge: number;
  role: string;
}

interface SalesByCategory {
  category: string;
  total_quantity_sold: number;
  total_revenue: number;
  item_count: number;
}

interface SalesTrend {
  date: string;
  total_items_sold: number;
  total_revenue: number;
  unique_items: number;
}

// Get best-selling items
export const getBestSellingItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, limit, item_type } = req.query;

    let query = '';
    let queryParams: any[] = [];

    // Build the base query - aggregate across all roles for each menu item
    const baseQuery = `
      SELECT 
        mi.menu_item_id,
        mi.name,
        mi.item_type,
        mi.upcharge,
        STRING_AGG(DISTINCT md.role, ', ') as roles,
        COUNT(*) as total_quantity_sold,
        SUM(COALESCE(mi.upcharge, 0)) as total_revenue,
        AVG(COALESCE(mi.upcharge, 0)) as average_price
      FROM meal_detail md
      INNER JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
      INNER JOIN meal m ON md.meal_id = m.meal_id
      INNER JOIN "Order" o ON m.order_id = o.order_id
      WHERE o.order_status = 'completed'
        AND md.menu_item_id IS NOT NULL
    `;

    const conditions: string[] = [];
    let paramCount = 1;

    // Add date filter if provided
    if (start_date && end_date) {
      conditions.push(`DATE(o.datetime) >= $${paramCount++} AND DATE(o.datetime) <= $${paramCount++}`);
      queryParams.push(start_date as string, end_date as string);
    } else {
      // Default: last 30 days
      conditions.push(`o.datetime >= CURRENT_DATE - INTERVAL '30 days'`);
    }

    // Add item type filter if provided
    if (item_type) {
      conditions.push(`mi.item_type = $${paramCount++}`);
      queryParams.push(item_type as string);
    }

    query = `${baseQuery} AND ${conditions.join(' AND ')}
      GROUP BY mi.menu_item_id, mi.name, mi.item_type, mi.upcharge
      ORDER BY total_quantity_sold DESC, total_revenue DESC`;

    // Add limit if provided
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    query += ` LIMIT ${limitNum}`;

    const result = await pool.query(query, queryParams);

    const items: BestSellingItem[] = result.rows.map((row) => ({
      menu_item_id: row.menu_item_id,
      name: row.name,
      item_type: row.item_type,
      total_quantity_sold: parseInt(row.total_quantity_sold) || 0,
      total_revenue: parseFloat(row.total_revenue) || 0,
      average_price: parseFloat(row.average_price) || 0,
      upcharge: parseFloat(row.upcharge) || 0,
      role: row.roles || '',
    }));

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching best-selling items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve best-selling items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get sales by category (entree, side, drink)
export const getSalesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    if (start_date && end_date) {
      query = `
        SELECT 
          mi.item_type as category,
          COUNT(*) as total_quantity_sold,
          SUM(COALESCE(mi.upcharge, 0)) as total_revenue,
          COUNT(DISTINCT mi.menu_item_id) as item_count
        FROM meal_detail md
        INNER JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
        INNER JOIN meal m ON md.meal_id = m.meal_id
        INNER JOIN "Order" o ON m.order_id = o.order_id
        WHERE o.order_status = 'completed'
          AND md.menu_item_id IS NOT NULL
          AND DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
        GROUP BY mi.item_type
        ORDER BY total_quantity_sold DESC
      `;
      queryParams = [start_date as string, end_date as string];
    } else {
      // Default: last 30 days
      query = `
        SELECT 
          mi.item_type as category,
          COUNT(*) as total_quantity_sold,
          SUM(COALESCE(mi.upcharge, 0)) as total_revenue,
          COUNT(DISTINCT mi.menu_item_id) as item_count
        FROM meal_detail md
        INNER JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
        INNER JOIN meal m ON md.meal_id = m.meal_id
        INNER JOIN "Order" o ON m.order_id = o.order_id
        WHERE o.order_status = 'completed'
          AND md.menu_item_id IS NOT NULL
          AND o.datetime >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY mi.item_type
        ORDER BY total_quantity_sold DESC
      `;
    }

    const result = await pool.query(query, queryParams);

    const categories: SalesByCategory[] = result.rows.map((row) => ({
      category: row.category || 'unknown',
      total_quantity_sold: parseInt(row.total_quantity_sold) || 0,
      total_revenue: parseFloat(row.total_revenue) || 0,
      item_count: parseInt(row.item_count) || 0,
    }));

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching sales by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sales by category',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get sales trends (daily sales of items)
export const getSalesTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    if (start_date && end_date) {
      query = `
        SELECT 
          DATE(o.datetime) as date,
          COUNT(*) as total_items_sold,
          SUM(COALESCE(mi.upcharge, 0)) as total_revenue,
          COUNT(DISTINCT mi.menu_item_id) as unique_items
        FROM meal_detail md
        INNER JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
        INNER JOIN meal m ON md.meal_id = m.meal_id
        INNER JOIN "Order" o ON m.order_id = o.order_id
        WHERE o.order_status = 'completed'
          AND md.menu_item_id IS NOT NULL
          AND DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
      queryParams = [start_date as string, end_date as string];
    } else {
      // Default: last 30 days
      query = `
        SELECT 
          DATE(o.datetime) as date,
          COUNT(*) as total_items_sold,
          SUM(COALESCE(mi.upcharge, 0)) as total_revenue,
          COUNT(DISTINCT mi.menu_item_id) as unique_items
        FROM meal_detail md
        INNER JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
        INNER JOIN meal m ON md.meal_id = m.meal_id
        INNER JOIN "Order" o ON m.order_id = o.order_id
        WHERE o.order_status = 'completed'
          AND md.menu_item_id IS NOT NULL
          AND o.datetime >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(o.datetime)
        ORDER BY DATE(o.datetime) DESC
      `;
    }

    const result = await pool.query(query, queryParams);

    const trends: SalesTrend[] = result.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      total_items_sold: parseInt(row.total_items_sold) || 0,
      total_revenue: parseFloat(row.total_revenue) || 0,
      unique_items: parseInt(row.unique_items) || 0,
    }));

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sales trends',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get summary statistics for sales
export const getSalesSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let query = '';
    let queryParams: string[] = [];

    if (start_date && end_date) {
      query = `
        SELECT 
          COUNT(DISTINCT mi.menu_item_id) as total_items_sold,
          COUNT(*) as total_quantity_sold,
          SUM(COALESCE(mi.upcharge, 0)) as total_revenue,
          AVG(COALESCE(mi.upcharge, 0)) as average_item_price
        FROM meal_detail md
        INNER JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
        INNER JOIN meal m ON md.meal_id = m.meal_id
        INNER JOIN "Order" o ON m.order_id = o.order_id
        WHERE o.order_status = 'completed'
          AND md.menu_item_id IS NOT NULL
          AND DATE(o.datetime) >= $1 
          AND DATE(o.datetime) <= $2
      `;
      queryParams = [start_date as string, end_date as string];
    } else {
      // Default: last 30 days
      query = `
        SELECT 
          COUNT(DISTINCT mi.menu_item_id) as total_items_sold,
          COUNT(*) as total_quantity_sold,
          SUM(COALESCE(mi.upcharge, 0)) as total_revenue,
          AVG(COALESCE(mi.upcharge, 0)) as average_item_price
        FROM meal_detail md
        INNER JOIN menu_items mi ON md.menu_item_id = mi.menu_item_id
        INNER JOIN meal m ON md.meal_id = m.meal_id
        INNER JOIN "Order" o ON m.order_id = o.order_id
        WHERE o.order_status = 'completed'
          AND md.menu_item_id IS NOT NULL
          AND o.datetime >= CURRENT_DATE - INTERVAL '30 days'
      `;
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          total_items_sold: 0,
          total_quantity_sold: 0,
          total_revenue: 0,
          average_item_price: 0,
        },
      });
      return;
    }

    const row = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        total_items_sold: parseInt(row.total_items_sold) || 0,
        total_quantity_sold: parseInt(row.total_quantity_sold) || 0,
        total_revenue: parseFloat(row.total_revenue) || 0,
        average_item_price: parseFloat(row.average_item_price) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sales summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
