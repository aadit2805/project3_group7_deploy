import { Router } from 'express';
import {
  getInventory,
  getLowStock,
  addInventoryItem,
  updateInventoryItem,
  getMenuItems,
  addFoodItemWithMenuItem,
  getRestockReport,
  deleteInventoryItem, // Import the delete controller function
} from '../controllers/inventoryController';

const router = Router();

router.get('/', getInventory);
router.get('/low-stock', getLowStock);
router.get('/restock-report', getRestockReport);
router.post('/', addInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem); // Add DELETE route
router.get('/menu-items', getMenuItems);
router.post('/food-with-menu-item', addFoodItemWithMenuItem);

export default router;
