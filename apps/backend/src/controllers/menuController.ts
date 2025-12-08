import { Request, Response } from 'express';
import pool from '../config/db';
import { createAuditLog } from '../services/auditService';

// TypeScript interface matching the database schema
interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
  availability_start_time?: string | null;
  availability_end_time?: string | null;
}

/**
 * Helper function to check if current time is within availability window
 * @param startTime - Start time in HH:mm:ss or HH:mm format, or null/undefined
 * @param endTime - End time in HH:mm:ss or HH:mm format, or null/undefined
 * @returns True if current time is within the availability window, false otherwise
 */
function isWithinAvailabilityWindow(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): boolean {
  // If no time restrictions are set, always available
  if (!startTime || !endTime) {
    return true;
  }

  // Parse time strings (HH:mm:ss format from DB or HH:mm from input)
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes; // Convert to minutes since midnight
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);

  // Handle midnight crossing (e.g., 22:00 to 02:00)
  if (startMinutes > endMinutes) {
    // Window crosses midnight (e.g., 22:00 to 02:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  } else {
    // Normal window within same day (e.g., 08:00 to 18:00)
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}

/**
 * Helper function to filter menu items by time-based availability
 * @param items - Array of menu items to filter
 * @returns Filtered array of menu items that are currently available based on time restrictions
 */
function filterByTimeAvailability(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => {
    // If is_available is false, item is not available regardless of time
    if (!item.is_available) {
      return false;
    }

    // Check time-based availability
    return isWithinAvailabilityWindow(
      item.availability_start_time,
      item.availability_end_time
    );
  });
}

/**
 * GET /api/menu-items
 * Get all menu items with optional filtering by availability
 * @param req - Express request object (supports query param: is_available=true)
 * @param res - Express response object
 * @returns JSON array of menu items with stock information
 */
export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    // Include stock information from inventory table
    let query = `
      SELECT 
        m.menu_item_id, 
        m.name, 
        m.upcharge, 
        m.is_available, 
        m.item_type, 
        m.availability_start_time, 
        m.availability_end_time, 
        m.allergens, 
        m.allergen_info,
        COALESCE(i.stock, 0) as stock
      FROM menu_items m
      LEFT JOIN inventory i ON m.menu_item_id = i.menu_item_id
    `;
    const queryParams: (string | boolean)[] = [];

    if (req.query.is_available === 'true') {
      query += ' WHERE m.is_available = $1';
      queryParams.push(true);
    }

    query += ' ORDER BY m.menu_item_id';

    const result = await pool.query(query, queryParams);
    let items = result.rows;

    // If filtering by availability, also filter by time-based availability and stock
    if (req.query.is_available === 'true') {
      items = filterByTimeAvailability(items);
      // Filter out items with stock = 0 for customer-facing requests
      items = items.filter((item: MenuItem & { stock?: number }) => (item.stock ?? 0) > 0);
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      error: 'Failed to retrieve menu items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get menu items filtered by availability
 * Returns only items that are marked as available and within their time window
 * @param _req - Express request object
 * @param res - Express response object
 * @returns JSON array of available menu items
 */
export const getAvailableMenuItems = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info FROM menu_items WHERE is_available = true ORDER BY menu_item_id'
    );
    // Filter by time-based availability
    const filteredItems = filterByTimeAvailability(result.rows);
    res.status(200).json(filteredItems);
  } catch (error) {
    console.error('Error fetching available menu items:', error);
    res.status(500).json({
      error: 'Failed to retrieve available menu items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get menu items filtered by type (entree, side, drink)
 * @param req - Express request object (requires type param)
 * @param res - Express response object
 * @returns JSON array of menu items matching the specified type
 */
export const getMenuItemsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const result = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info FROM menu_items WHERE item_type = $1 ORDER BY menu_item_id',
      [type]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items by type:', error);
    res.status(500).json({
      error: 'Failed to retrieve menu items by type',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get a single menu item by ID
 * @param req - Express request object (requires id param)
 * @param res - Express response object
 * @returns JSON object of the menu item or 404 if not found
 */
export const getMenuItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info FROM menu_items WHERE menu_item_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching menu item by ID:', error);
    res.status(500).json({
      error: 'Failed to retrieve menu item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get menu items with inventory information (stock and reorder status)
 * @param _req - Express request object
 * @param res - Express response object
 * @returns JSON array of menu items with inventory details
 */
export const getMenuItemsWithInventory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT 
        m.menu_item_id, 
        m.name, 
        m.upcharge, 
        m.is_available, 
        m.item_type,
        m.availability_start_time,
        m.availability_end_time,
        m.allergens,
        m.allergen_info,
        i.stock,
        i.reorder
      FROM menu_items m
      LEFT JOIN inventory i ON m.menu_item_id = i.menu_item_id
      ORDER BY m.menu_item_id`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items with inventory:', error);
    res.status(500).json({
      error: 'Failed to retrieve menu items with inventory',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/menu-items (Manager only)
 * Create a new menu item and corresponding inventory entry
 * @param req - Express request object with menu item data in body
 * @param res - Express response object
 * @returns JSON object with success status and created menu item data
 */
export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      upcharge,
      is_available,
      item_type,
      menu_item_id,
      stock,
      reorder,
      storage,
      availability_start_time,
      availability_end_time,
      allergens,
      allergen_info,
    } = req.body;

    // Validation
    if (!name || !item_type || stock === undefined || reorder === undefined || !storage) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, item_type, stock, reorder, and storage are required',
      });
      return;
    }

    // Validate item_type
    const validTypes = ['entree', 'side', 'drink'];
    if (!validTypes.includes(item_type.toLowerCase())) {
      res.status(400).json({
        error: 'Invalid item_type',
        message: `item_type must be one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    // Get next menu_item_id if not provided
    let itemId = menu_item_id;
    if (!itemId) {
      const maxIdResult = await pool.query(
        'SELECT COALESCE(MAX(menu_item_id), 0) + 1 as next_id FROM menu_items'
      );
      itemId = maxIdResult.rows[0].next_id;
    } else {
      // Check if ID already exists
      const existingResult = await pool.query(
        'SELECT menu_item_id FROM menu_items WHERE menu_item_id = $1',
        [itemId]
      );
      if (existingResult.rows.length > 0) {
        res.status(409).json({
          error: 'Menu item ID already exists',
          message: `Menu item with ID ${itemId} already exists`,
        });
        return;
      }
    }

    // Process allergens - convert array to JSON string if provided
    const allergensJson = allergens ? JSON.stringify(Array.isArray(allergens) ? allergens : [allergens]) : null;
    
    // Generate allergen_info if not provided but allergens are
    let finalAllergenInfo = allergen_info;
    if (!finalAllergenInfo && allergensJson) {
      try {
        const allergenArray = JSON.parse(allergensJson);
        if (allergenArray.length > 0) {
          finalAllergenInfo = `Contains: ${allergenArray.join(', ')}`;
        } else {
          finalAllergenInfo = 'No major allergens';
        }
      } catch {
        finalAllergenInfo = allergen_info || null;
      }
    }

    // Insert new menu item
    const result = await pool.query<MenuItem>(
      `INSERT INTO menu_items (menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info`,
      [
        itemId,
        name,
        upcharge || 0,
        is_available !== undefined ? is_available : true,
        item_type.toLowerCase(),
        availability_start_time || null,
        availability_end_time || null,
        allergensJson,
        finalAllergenInfo,
      ]
    );

    const newMenuItem = result.rows[0];

    // Create corresponding entry in inventory table
    const maxInventoryIdResult = await pool.query(
      'SELECT COALESCE(MAX(inventory_id), 0) + 1 as next_id FROM inventory'
    );
    const newInventoryId = maxInventoryIdResult.rows[0].next_id;

    await pool.query(
      `INSERT INTO inventory (inventory_id, menu_item_id, stock, reorder, storage)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        newInventoryId,
        newMenuItem.menu_item_id,
        stock,
        reorder,
        storage,
      ]
    );

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'CREATE',
      entity_type: 'menu_item',
      entity_id: String(newMenuItem.menu_item_id),
      new_values: newMenuItem,
      description: `Created menu item: ${name} (ID: ${newMenuItem.menu_item_id})`,
    });

    res.status(201).json({
      success: true,
      message: 'Menu item and inventory item created successfully',
      data: newMenuItem,
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      error: 'Failed to create menu item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/menu-items/:id (Manager only)
 * Update an existing menu item
 * @param req - Express request object with menu item data in body and id in params
 * @param res - Express response object
 * @returns JSON object with success status and updated menu item data
 */
export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      upcharge,
      is_available,
      item_type,
      availability_start_time,
      availability_end_time,
      allergens,
      allergen_info,
    } = req.body;

    // Get old values for audit log
    const oldItemResult = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info FROM menu_items WHERE menu_item_id = $1',
      [id]
    );

    if (oldItemResult.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    const oldMenuItem = oldItemResult.rows[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (upcharge !== undefined) {
      updates.push(`upcharge = $${paramCount++}`);
      values.push(upcharge);
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(is_available);
    }
    if (item_type !== undefined) {
      const validTypes = ['entree', 'side', 'drink'];
      if (!validTypes.includes(item_type.toLowerCase())) {
        res.status(400).json({
          error: 'Invalid item_type',
          message: `item_type must be one of: ${validTypes.join(', ')}`,
        });
        return;
      }
      updates.push(`item_type = $${paramCount++}`);
      values.push(item_type.toLowerCase());
    }
    if (availability_start_time !== undefined) {
      updates.push(`availability_start_time = $${paramCount++}`);
      values.push(availability_start_time || null);
    }
    if (availability_end_time !== undefined) {
      updates.push(`availability_end_time = $${paramCount++}`);
      values.push(availability_end_time || null);
    }
    if (allergens !== undefined) {
      const allergensJson = allergens ? JSON.stringify(Array.isArray(allergens) ? allergens : [allergens]) : null;
      updates.push(`allergens = $${paramCount++}`);
      values.push(allergensJson);
      
      // Auto-generate allergen_info if not provided but allergens are
      if (allergen_info === undefined && allergensJson) {
        try {
          const allergenArray = JSON.parse(allergensJson);
          if (allergenArray.length > 0) {
            updates.push(`allergen_info = $${paramCount++}`);
            values.push(`Contains: ${allergenArray.join(', ')}`);
          } else {
            updates.push(`allergen_info = $${paramCount++}`);
            values.push('No major allergens');
          }
        } catch {
          // If parsing fails, don't update allergen_info
        }
      }
    }
    if (allergen_info !== undefined) {
      updates.push(`allergen_info = $${paramCount++}`);
      values.push(allergen_info || null);
    }

    if (updates.length === 0) {
      res.status(400).json({
        error: 'No fields to update',
        message: 'Provide at least one field to update',
      });
      return;
    }

    values.push(id);
    const result = await pool.query<MenuItem>(
      `UPDATE menu_items 
       SET ${updates.join(', ')}
       WHERE menu_item_id = $${paramCount}
       RETURNING menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    const updatedMenuItem = result.rows[0];

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'UPDATE',
      entity_type: 'menu_item',
      entity_id: String(id),
      old_values: oldMenuItem,
      new_values: updatedMenuItem,
      description: `Updated menu item: ${updatedMenuItem.name} (ID: ${id})`,
    });

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedMenuItem,
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      error: 'Failed to update menu item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/menu-items/:id/deactivate (Manager only)
 * Deactivate a menu item by setting is_available to false
 * @param req - Express request object with id in params
 * @param res - Express response object
 * @returns JSON object with success status and deactivated menu item data
 */
export const deactivateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get old values for audit log
    const oldItemResult = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info FROM menu_items WHERE menu_item_id = $1',
      [id]
    );

    if (oldItemResult.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    const oldMenuItem = oldItemResult.rows[0];

    const result = await pool.query(
      'UPDATE menu_items SET is_available = false WHERE menu_item_id = $1 RETURNING menu_item_id, is_available, name',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'DEACTIVATE',
      entity_type: 'menu_item',
      entity_id: String(id),
      old_values: oldMenuItem,
      new_values: { ...oldMenuItem, is_available: false },
      description: `Deactivated menu item: ${oldMenuItem.name} (ID: ${id})`,
    });

    res.status(200).json({
      success: true,
      message: 'Menu item deactivated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deactivating menu item:', error);
    res.status(500).json({
      error: 'Failed to deactivate menu item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete a menu item permanently
 * @param req - Express request object with id in params
 * @param res - Express response object
 * @returns JSON object with success status and deleted menu item data
 */
export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get old values for audit log
    const oldItemResult = await pool.query<MenuItem>(
      'SELECT menu_item_id, name, upcharge, is_available, item_type, availability_start_time, availability_end_time, allergens, allergen_info FROM menu_items WHERE menu_item_id = $1',
      [id]
    );

    if (oldItemResult.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    const oldMenuItem = oldItemResult.rows[0];

    // Delete the menu item (cascade will handle related inventory)
    const result = await pool.query(
      'DELETE FROM menu_items WHERE menu_item_id = $1 RETURNING menu_item_id, name',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'DELETE',
      entity_type: 'menu_item',
      entity_id: String(id),
      old_values: oldMenuItem,
      new_values: null,
      description: `Deleted menu item: ${oldMenuItem.name} (ID: ${id})`,
    });

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      error: 'Failed to delete menu item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/meal-types
 * Get all meal types (e.g., breakfast, lunch, dinner)
 * @param _req - Express request object
 * @param res - Express response object
 * @returns JSON array of all meal types
 */
export const getMealTypes = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM meal_types');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/meal-types/:id
 * Get a single meal type by ID
 * @param req - Express request object with id in params
 * @param res - Express response object
 * @returns JSON object of the meal type or 404 if not found
 */
export const getMealTypeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM meal_types WHERE meal_type_id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Meal type not found' });
    }
  } catch (err) {
    console.error('Error fetching meal type by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
