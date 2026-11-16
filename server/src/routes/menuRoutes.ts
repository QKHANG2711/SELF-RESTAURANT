import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Categories
router.get('/categories', getCategories);
router.post('/categories', authenticate, requireRoles('MANAGER'), createCategory);
router.put('/categories/:id', authenticate, requireRoles('MANAGER'), updateCategory);
router.delete('/categories/:id', authenticate, requireRoles('MANAGER'), deleteCategory);

// Menu items
router.get('/items', getMenuItems);
router.get('/items/:id', getMenuItemById);
router.post('/items', authenticate, requireRoles('MANAGER'), createMenuItem);
router.put('/items/:id', authenticate, requireRoles('MANAGER'), updateMenuItem);
router.delete('/items/:id', authenticate, requireRoles('MANAGER'), deleteMenuItem);

export default router;
