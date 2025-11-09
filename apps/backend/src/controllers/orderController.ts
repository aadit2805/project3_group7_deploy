import { Request, Response } from 'express';
import pool from '../config/db';

export const createOrder = async (req: Request, res: Response) => {
  const { order_items } = req.body;

  if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
    return res.status(400).json({ success: false, error: 'Order items are required' });
  }

  const client = await pool.connect();

  try {
    const maxIdResult = await client.query('SELECT MAX(order_id) as max_id FROM "Order"');
    const maxId = maxIdResult.rows[0].max_id;
    const newOrderId = (maxId === null ? 0 : maxId) + 1;

    const orderResult = await client.query(
      'INSERT INTO "Order" (order_id, price, order_status, staff_id, datetime) VALUES ($1, $2, $3, $4, NOW()) RETURNING order_id',
      [newOrderId, 0, 'pending', 1] // Default values for a new order
    );
    const orderId = orderResult.rows[0].order_id;

    const maxMealIdResult = await client.query('SELECT MAX(meal_id) as max_id FROM "meal"');
    let nextMealId =
      (maxMealIdResult.rows[0].max_id === null ? 0 : maxMealIdResult.rows[0].max_id) + 1;

    const maxDetailIdResult = await client.query(
      'SELECT MAX(detail_id) as max_id FROM "meal_detail"'
    );
    let nextDetailId =
      (maxDetailIdResult.rows[0].max_id === null ? 0 : maxDetailIdResult.rows[0].max_id) + 1;

    for (const item of order_items) {
      const mealResult = await client.query(
        'INSERT INTO "meal" (meal_id, order_id, meal_type_id) VALUES ($1, $2, $3) RETURNING meal_id',
        [nextMealId, orderId, item.mealType.meal_type_id]
      );
      const mealId = mealResult.rows[0].meal_id;

      for (const entree of item.entrees) {
        await client.query(
          'INSERT INTO "meal_detail" (detail_id, meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4, $5)',
          [nextDetailId, mealId, item.mealType.meal_type_id, entree.menu_item_id, 'entree']
        );
        nextDetailId++;
      }

      for (const side of item.sides) {
        await client.query(
          'INSERT INTO "meal_detail" (detail_id, meal_id, meal_type_id, menu_item_id, role) VALUES ($1, $2, $3, $4, $5)',
          [nextDetailId, mealId, item.mealType.meal_type_id, side.menu_item_id, 'side']
        );
        nextDetailId++;
      }
      nextMealId++;
    }

    return res.status(201).json({ success: true, data: { orderId } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

export const getActiveOrders = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    // Get all orders that are not completed or cancelled
    // Active orders are those with status: pending, processing, preparing, ready, etc.
    // Excluding: completed, cancelled
    const result = await client.query(
      `SELECT 
        o.order_id,
        o.staff_id,
        o.datetime,
        o.price,
        o.order_status,
        s.username as staff_username,
        COUNT(DISTINCT m.meal_id) as meal_count
      FROM "Order" o
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN meal m ON o.order_id = m.order_id
      WHERE (o.order_status IS NULL OR o.order_status NOT IN ('completed', 'cancelled'))
      GROUP BY o.order_id, o.staff_id, o.datetime, o.price, o.order_status, s.username
      ORDER BY o.datetime DESC NULLS LAST, o.order_id DESC`
    );

    return res.status(200).json({ 
      success: true, 
      data: result.rows.map(row => ({
        order_id: row.order_id,
        staff_id: row.staff_id,
        staff_username: row.staff_username,
        datetime: row.datetime,
        price: row.price ? parseFloat(row.price) : 0,
        order_status: row.order_status || 'pending',
        meal_count: parseInt(row.meal_count) || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};
