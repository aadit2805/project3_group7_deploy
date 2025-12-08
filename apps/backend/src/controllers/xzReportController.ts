import { Request, Response } from 'express';
import pool from '../config/db';
import { createAuditLog } from '../services/auditService';

/**
 * GET /api/reports/x-report (Manager only)
 * X Report - Non-closing mid-day sales report
 * Shows current day sales without closing the register
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON object with current day sales data
 */
export const getXReport = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get today's date from the database to avoid timezone issues
    const dateResult = await pool.query('SELECT CURRENT_DATE as today');
    const today = dateResult.rows[0].today;

    // Get summary stats for today
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(o.price), 0) as total_sales,
        COUNT(DISTINCT o.order_id) as order_count,
        CASE 
          WHEN COUNT(DISTINCT o.order_id) > 0 
          THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
          ELSE 0 
        END as average_order_value,
        COALESCE(SUM(o.price * 0.0825), 0) as total_tax,
        COALESCE(SUM(o.price * 0.9175), 0) as net_sales,
        MIN(o.datetime) as first_transaction,
        MAX(o.datetime) as last_transaction
      FROM "Order" o
      WHERE DATE(o.datetime) = $1
        AND o.order_status != 'cancelled'
    `;

    const summaryResult = await pool.query(summaryQuery, [today]);
    const summary = summaryResult.rows[0];

    // Get order breakdown by status
    const statusQuery = `
      SELECT 
        o.order_status,
        COUNT(*) as count,
        COALESCE(SUM(o.price), 0) as total
      FROM "Order" o
      WHERE DATE(o.datetime) = $1
      GROUP BY o.order_status
      ORDER BY o.order_status
    `;

    const statusResult = await pool.query(statusQuery, [today]);

    // Get order breakdown by staff
    const staffQuery = `
      SELECT 
        s.staff_id,
        s.username,
        COUNT(DISTINCT o.order_id) as order_count,
        COALESCE(SUM(o.price), 0) as total_sales
      FROM "Order" o
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      WHERE DATE(o.datetime) = $1
        AND o.order_status != 'cancelled'
      GROUP BY s.staff_id, s.username
      ORDER BY total_sales DESC
    `;

    const staffResult = await pool.query(staffQuery, [today]);

    // Get payment method breakdown (if you have payment methods tracked)
    const paymentQuery = `
      SELECT 
        COALESCE(p.method, 'Cash') as payment_method,
        COUNT(DISTINCT o.order_id) as count,
        COALESCE(SUM(o.price), 0) as total
      FROM "Order" o
      LEFT JOIN payment p ON o.order_id = p.order_id
      WHERE DATE(o.datetime) = $1
        AND o.order_status != 'cancelled'
      GROUP BY p.method
      ORDER BY total DESC
    `;

    const paymentResult = await pool.query(paymentQuery, [today]);

    // Get recent orders (last 10)
    const recentOrdersQuery = `
      SELECT 
        o.order_id,
        o.datetime,
        o.price,
        o.order_status,
        o.customer_name,
        s.username as staff_username
      FROM "Order" o
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      WHERE DATE(o.datetime) = $1
      ORDER BY o.datetime DESC
      LIMIT 10
    `;

    const recentOrdersResult = await pool.query(recentOrdersQuery, [today]);

    res.status(200).json({
      success: true,
      data: {
        report_type: 'X Report',
        report_date: today,
        report_time: new Date().toISOString(),
        is_closing_report: false,
        summary: {
          total_sales: parseFloat(summary.total_sales),
          order_count: parseInt(summary.order_count),
          average_order_value: parseFloat(summary.average_order_value),
          total_tax: parseFloat(summary.total_tax),
          net_sales: parseFloat(summary.net_sales),
          first_transaction: summary.first_transaction,
          last_transaction: summary.last_transaction,
        },
        order_status_breakdown: statusResult.rows.map((row) => ({
          status: row.order_status || 'pending',
          count: parseInt(row.count),
          total: parseFloat(row.total),
        })),
        staff_breakdown: staffResult.rows.map((row) => ({
          staff_id: row.staff_id,
          username: row.username || 'Unknown',
          order_count: parseInt(row.order_count),
          total_sales: parseFloat(row.total_sales),
        })),
        payment_breakdown: paymentResult.rows.map((row) => ({
          payment_method: row.payment_method,
          count: parseInt(row.count),
          total: parseFloat(row.total),
        })),
        recent_orders: recentOrdersResult.rows.map((row) => ({
          order_id: row.order_id,
          datetime: row.datetime,
          price: parseFloat(row.price),
          order_status: row.order_status || 'pending',
          customer_name: row.customer_name || 'Guest',
          staff_username: row.staff_username || 'Unknown',
        })),
      },
    });

    // Log audit entry for X Report generation
    await createAuditLog(req, {
      action_type: 'VIEW',
      entity_type: 'x_report',
      entity_id: today,
      description: `Generated X Report for ${today}`,
    });
  } catch (error) {
    console.error('Error generating X Report:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

/**
 * POST /api/reports/z-report (Manager only)
 * Z Report - End-of-day closing report
 * Closes the register for the day and creates a daily summary record
 * @param req - Express request object
 * @param res - Express response object
 * @returns JSON object with final day sales data and closing confirmation
 */
export const createZReport = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get today's date from the database to avoid timezone issues
    const dateResult = await client.query('SELECT CURRENT_DATE as today');
    const today = dateResult.rows[0].today;

    // Check if Z Report already exists for today
    const existingReport = await client.query(
      'SELECT * FROM dailysummaries WHERE business_date = $1',
      [today]
    );

    if (existingReport.rows.length > 0 && (existingReport.rows[0].closed_at || existingReport.rows[0].status === 'CLOSED')) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        error: 'Z Report already generated for today. Day is closed.',
      });
      return;
    }

    // Get summary stats for today
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(o.price), 0) as total_sales,
        COUNT(DISTINCT o.order_id) as order_count,
        CASE 
          WHEN COUNT(DISTINCT o.order_id) > 0 
          THEN COALESCE(SUM(o.price), 0) / COUNT(DISTINCT o.order_id)
          ELSE 0 
        END as average_order_value,
        COALESCE(SUM(o.price * 0.0825), 0) as total_tax,
        COALESCE(SUM(o.price * 0.9175), 0) as net_sales,
        MIN(o.datetime) as first_transaction,
        MAX(o.datetime) as last_transaction
      FROM "Order" o
      WHERE DATE(o.datetime) = $1
        AND o.order_status != 'cancelled'
    `;

    const summaryResult = await client.query(summaryQuery, [today]);
    const summary = summaryResult.rows[0];

    // Get order breakdown by status
    const statusQuery = `
      SELECT 
        o.order_status,
        COUNT(*) as count,
        COALESCE(SUM(o.price), 0) as total
      FROM "Order" o
      WHERE DATE(o.datetime) = $1
      GROUP BY o.order_status
      ORDER BY o.order_status
    `;

    const statusResult = await client.query(statusQuery, [today]);

    // Get order breakdown by staff
    const staffQuery = `
      SELECT 
        s.staff_id,
        s.username,
        COUNT(DISTINCT o.order_id) as order_count,
        COALESCE(SUM(o.price), 0) as total_sales
      FROM "Order" o
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      WHERE DATE(o.datetime) = $1
        AND o.order_status != 'cancelled'
      GROUP BY s.staff_id, s.username
      ORDER BY total_sales DESC
    `;

    const staffResult = await client.query(staffQuery, [today]);

    // Get payment method breakdown
    const paymentQuery = `
      SELECT 
        COALESCE(p.method, 'Cash') as payment_method,
        COUNT(DISTINCT o.order_id) as count,
        COALESCE(SUM(o.price), 0) as total
      FROM "Order" o
      LEFT JOIN payment p ON o.order_id = p.order_id
      WHERE DATE(o.datetime) = $1
        AND o.order_status != 'cancelled'
      GROUP BY p.method
      ORDER BY total DESC
    `;

    const paymentResult = await client.query(paymentQuery, [today]);

    // Create or update daily summary record
    if (existingReport.rows.length > 0) {
      await client.query(
        `UPDATE dailysummaries 
         SET total_sales = $1, 
             total_tax = $2, 
             net_sales = $3, 
             order_count = $4,
             status = 'CLOSED',
             closed_at = NOW()
         WHERE business_date = $5`,
        [
          parseFloat(summary.total_sales),
          parseFloat(summary.total_tax),
          parseFloat(summary.net_sales),
          parseInt(summary.order_count),
          today,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO dailysummaries 
         (business_date, total_sales, total_tax, net_sales, order_count, status, opened_at, closed_at) 
         VALUES ($1, $2, $3, $4, $5, 'CLOSED', NOW(), NOW())`,
        [
          today,
          parseFloat(summary.total_sales),
          parseFloat(summary.total_tax),
          parseFloat(summary.net_sales),
          parseInt(summary.order_count),
        ]
      );
    }

    await client.query('COMMIT');

    const reportData = {
      report_type: 'Z Report',
      report_date: today,
      report_time: new Date().toISOString(),
      is_closing_report: true,
      status: 'closed',
      summary: {
        total_sales: parseFloat(summary.total_sales),
        order_count: parseInt(summary.order_count),
        average_order_value: parseFloat(summary.average_order_value),
        total_tax: parseFloat(summary.total_tax),
        net_sales: parseFloat(summary.net_sales),
        first_transaction: summary.first_transaction,
        last_transaction: summary.last_transaction,
      },
      order_status_breakdown: statusResult.rows.map((row) => ({
        status: row.order_status || 'pending',
        count: parseInt(row.count),
        total: parseFloat(row.total),
      })),
      staff_breakdown: staffResult.rows.map((row) => ({
        staff_id: row.staff_id,
        username: row.username || 'Unknown',
        order_count: parseInt(row.order_count),
        total_sales: parseFloat(row.total_sales),
      })),
      payment_breakdown: paymentResult.rows.map((row) => ({
        payment_method: row.payment_method,
        count: parseInt(row.count),
        total: parseFloat(row.total),
      })),
    };

    res.status(200).json({
      success: true,
      data: reportData,
      message: 'Day closed successfully. Z Report generated.',
    });

    // Log audit entry for Z Report generation
    await createAuditLog(req, {
      action_type: 'CLOSE_DAY',
      entity_type: 'z_report',
      entity_id: today,
      new_values: reportData,
      description: `Generated Z Report and closed day for ${today}`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating Z Report:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

/**
 * GET /api/reports/z-report/history (Manager only)
 * Get historical Z Reports
 * @param req - Express request object (supports query params: start_date, end_date, limit)
 * @param res - Express response object
 * @returns JSON array of historical Z Reports
 */
export const getZReportHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, limit = '30' } = req.query;

    let query = '';
    let queryParams: any[] = [];

    if (start_date && end_date) {
      query = `
        SELECT * FROM dailysummaries
        WHERE business_date >= $1 AND business_date <= $2
          AND (closed_at IS NOT NULL OR status = 'CLOSED')
        ORDER BY business_date DESC
        LIMIT $3
      `;
      queryParams = [start_date, end_date, parseInt(limit as string)];
    } else {
      query = `
        SELECT * FROM dailysummaries
        WHERE closed_at IS NOT NULL OR status = 'CLOSED'
        ORDER BY business_date DESC
        LIMIT $1
      `;
      queryParams = [parseInt(limit as string)];
    }

    const result = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: result.rows.map((row) => ({
        summary_id: row.summary_id,
        business_date: row.business_date,
        total_sales: parseFloat(row.total_sales),
        total_tax: parseFloat(row.total_tax),
        net_sales: parseFloat(row.net_sales),
        order_count: row.order_count,
        status: row.status,
        opened_at: row.opened_at,
        closed_at: row.closed_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching Z Report history:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

