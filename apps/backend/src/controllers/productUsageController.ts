import { Request, Response } from 'express';
import { db } from '../db';

/**
 * Get product usage statistics for a given time period
 * Returns the count of each menu item used in orders during the specified time window
 */
export const getProductUsage = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }

    // Parse dates
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format' 
      });
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Get all orders in the time window
    const orders = await db.order.findMany({
      where: {
        datetime: {
          gte: start,
          lte: end,
        },
      },
      include: {
        meal: {
          include: {
            meal_detail: {
              include: {
                menu_items: {
                  include: {
                    inventory: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Count usage of each menu item
    const usageMap: Record<number, {
      menu_item_id: number;
      name: string;
      item_type: string;
      count: number;
      inventory_id?: number;
      current_stock?: number;
    }> = {};

    orders.forEach((order) => {
      order.meal.forEach((meal) => {
        meal.meal_detail.forEach((detail) => {
          if (detail.menu_items) {
            const itemId = detail.menu_items.menu_item_id;
            if (!usageMap[itemId]) {
              usageMap[itemId] = {
                menu_item_id: itemId,
                name: detail.menu_items.name || 'Unknown',
                item_type: detail.menu_items.item_type || 'unknown',
                count: 0,
                inventory_id: detail.menu_items.inventory[0]?.inventory_id,
                current_stock: detail.menu_items.inventory[0]?.stock ?? undefined,
              };
            }
            usageMap[itemId].count += 1;
          }
        });
      });
    });

    // Convert to array and sort by count (descending)
    const usageData = Object.values(usageMap).sort((a, b) => b.count - a.count);

    // Calculate totals
    const totalItems = usageData.reduce((sum, item) => sum + item.count, 0);
    const uniqueItems = usageData.length;

    return res.json({
      success: true,
      data: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalItems,
        uniqueItems,
        usage: usageData,
      },
    });
  } catch (error) {
    console.error('Error fetching product usage:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch product usage data' 
    });
  }
};

