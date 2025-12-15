import { Request, Response } from 'express';
import { db } from '../db';
import { createAuditLog } from '../services/auditService';

/**
 * Get all inventory items (both food and non-food)
 * Returns food inventory with associated menu items and non-food inventory
 */
export const getInventory = async (_req: Request, res: Response) => {
  try {
    const inventory = await db.inventory.findMany({
      include: {
        menu_items: true,
      },
    });
    const nonFoodInventory = await db.non_food_inventory.findMany();
    res.json({ food: inventory, non_food: nonFoodInventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

/**
 * Get inventory items that are marked for reorder
 * Returns both food and non-food items that need restocking
 */
export const getLowStock = async (_req: Request, res: Response) => {
  try {
    const food_inventory = await db.inventory.findMany({
      where: {
        reorder: true,
      },
      include: {
        menu_items: true,
      },
    });

    const non_food_inventory = await db.non_food_inventory.findMany({
      where: {
        reorder: true,
      },
    });
    res.json({ food: food_inventory, non_food: non_food_inventory });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

/**
 * Generate a restock report for items below threshold
 * Food items: stock < 20
 * Non-food items: stock < 80
 */
export const getRestockReport = async (_req: Request, res: Response) => {
  try {
    const lowFoodStock = await db.inventory.findMany({
      where: {
        stock: {
          lt: 20,
        },
      },
      include: {
        menu_items: true,
      },
    });

    const lowNonFoodStock = await db.non_food_inventory.findMany({
      where: {
        stock: {
          lt: 80,
        },
      },
    });

    res.json({ food: lowFoodStock, non_food: lowNonFoodStock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

/**
 * Add a new inventory item (food or non-food)
 * Creates audit log entry for the new item
 */
export const addInventoryItem = async (req: Request, res: Response) => {
  try {
    const { is_food, ...data } = req.body;
    if (is_food) {
      const { menu_item_id, stock, reorder, storage } = data;
      // Generate new inventory ID by finding max and incrementing
      const maxId = await db.inventory.aggregate({ _max: { inventory_id: true } });
      const newId = (maxId._max.inventory_id || 0) + 1;
      const item = await db.inventory.create({
        data: { inventory_id: newId, menu_item_id, stock, reorder, storage },
      });

      // Log audit entry
      await createAuditLog(req, {
        action_type: 'CREATE',
        entity_type: 'inventory',
        entity_id: String(newId),
        new_values: item,
        description: `Created food inventory item (ID: ${newId}, Menu Item ID: ${menu_item_id})`,
      });

      res.json(item);
    } else {
      const { name, stock, reorder } = data;
      // Generate new non-food inventory ID by finding max and incrementing
      const maxId = await db.non_food_inventory.aggregate({ _max: { supply_id: true } });
      const newId = (maxId._max.supply_id || 0) + 1;
      const item = await db.non_food_inventory.create({
        data: { supply_id: newId, name, stock, reorder },
      });

      // Log audit entry
      await createAuditLog(req, {
        action_type: 'CREATE',
        entity_type: 'non_food_inventory',
        entity_id: String(newId),
        new_values: item,
        description: `Created non-food inventory item: ${name} (ID: ${newId})`,
      });

      res.json(item);
    }
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

/**
 * Update an existing inventory item (food or non-food)
 * Tracks old and new values for audit logging
 */
export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_food, ...data } = req.body;

    if (is_food) {
      const { stock, reorder, storage } = data;

      // Get old values for audit log
      const oldItem = await db.inventory.findUnique({
        where: { inventory_id: Number(id) },
      });

      // Parse stock as number and handle reorder flag (can be boolean or string 'on')
      const parsedStock = Number(stock);
      const parsedReorder = reorder === 'true' || reorder === 'on';

      // Update the inventory item
      const inventoryItem = await db.inventory.update({
        where: { inventory_id: Number(id) },
        data: { stock: parsedStock, reorder: parsedReorder, storage },
      });

      // Log audit entry
      await createAuditLog(req, {
        action_type: 'UPDATE',
        entity_type: 'inventory',
        entity_id: String(id),
        old_values: oldItem,
        new_values: inventoryItem,
        description: `Updated food inventory item (ID: ${id})`,
      });

      return res.json({ inventoryItem });
    } else {
      const { stock, reorder } = data;

      // Get old values for audit log
      const oldItem = await db.non_food_inventory.findUnique({
        where: { supply_id: Number(id) },
      });

      const parsedStock = Number(stock);
      const parsedReorder = reorder === 'true' || reorder === 'on';

      const item = await db.non_food_inventory.update({
        where: { supply_id: Number(id) },
        data: { stock: parsedStock, reorder: parsedReorder },
      });

      // Log audit entry
      await createAuditLog(req, {
        action_type: 'UPDATE',
        entity_type: 'non_food_inventory',
        entity_id: String(id),
        old_values: oldItem,
        new_values: item,
        description: `Updated non-food inventory item: ${oldItem?.name} (ID: ${id})`,
      });

      return res.json(item); // Added return
    }
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({ error: 'Something went wrong' }); // Added return
  }
};

/**
 * Get all menu items
 * Returns list of all menu items in the database
 */
export const getMenuItems = async (_req: Request, res: Response) => {
  try {
    const menuItems = await db.menu_items.findMany();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

/**
 * Create a new menu item and its associated inventory entry
 * Creates both the menu item and inventory record in a single operation
 * Logs audit entries for both creations
 */
export const addFoodItemWithMenuItem = async (req: Request, res: Response) => {
  try {
    const { name, stock, reorder, storage, upcharge, is_available, item_type } = req.body;

    // Generate new menu item ID
    const maxMenuItemId = await db.menu_items.aggregate({ _max: { menu_item_id: true } });
    const newMenuItemId = (maxMenuItemId._max.menu_item_id || 0) + 1;

    // Create the menu item first
    const menuItem = await db.menu_items.create({
      data: {
        menu_item_id: newMenuItemId,
        name,
        upcharge,
        is_available,
        item_type,
      },
    });

    // Generate new inventory ID and create inventory entry
    const maxInventoryId = await db.inventory.aggregate({ _max: { inventory_id: true } });
    const newInventoryId = (maxInventoryId._max.inventory_id || 0) + 1;

    const inventoryItem = await db.inventory.create({
      data: {
        inventory_id: newInventoryId,
        menu_item_id: menuItem.menu_item_id,
        stock,
        reorder,
        storage,
      },
    });

    // Log audit entry for menu item creation
    await createAuditLog(req, {
      action_type: 'CREATE',
      entity_type: 'menu_item',
      entity_id: String(newMenuItemId),
      new_values: menuItem,
      description: `Created menu item with inventory: ${name} (Menu Item ID: ${newMenuItemId})`,
    });

    // Log audit entry for inventory creation
    await createAuditLog(req, {
      action_type: 'CREATE',
      entity_type: 'inventory',
      entity_id: String(newInventoryId),
      new_values: inventoryItem,
      description: `Created inventory item for menu item: ${name} (Inventory ID: ${newInventoryId})`,
    });

    res.json({ menuItem, inventoryItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

/**
 * Delete a non-food inventory item
 * Only non-food items can be deleted (food inventory is linked to menu items)
 * Creates audit log entry for the deletion
 */
export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_food } = req.body;

    // Only allow deletion of non-food items
    if (is_food) {
      return res.status(400).json({ 
        error: 'Cannot delete food inventory items. Food inventory is linked to menu items.' 
      });
    }

    // Get the item details before deletion for audit log
    const item = await db.non_food_inventory.findUnique({
      where: { supply_id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete the non-food inventory item
    await db.non_food_inventory.delete({
      where: { supply_id: Number(id) },
    });

    // Log audit entry
    await createAuditLog(req, {
      action_type: 'DELETE',
      entity_type: 'non_food_inventory',
      entity_id: String(id),
      old_values: item,
      description: `Deleted non-food inventory item: ${item.name} (ID: ${id})`,
    });

    return res.json({ message: 'Item deleted successfully', deletedItem: item });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
