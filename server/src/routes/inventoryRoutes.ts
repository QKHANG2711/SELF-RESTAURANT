import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import {
  getSuppliers, getSupplierById, createSupplier, updateSupplier,
  getIngredients, getLowStockIngredients, getIngredientCategories,
  createIngredient, updateIngredient, adjustStock,
  getStockReceipts, getStockReceiptById, createStockReceipt, confirmStockReceipt,
  getAllRecipes, getRecipeByMenuItem, upsertRecipe,
  getStockTransactions,
  getPromotions, validatePromotion, createPromotion, updatePromotion,
  getInventoryReport,
} from '../controllers/inventoryController';

const router = Router();

// === Public/Auth routes (Cashier cũng cần xem promotions) ===
router.get('/promotions', authenticate, getPromotions);
router.get('/promotions/validate', authenticate, validatePromotion);

// === All remaining routes require MANAGER ===
router.use(authenticate, requireRoles('MANAGER'));

// Suppliers
router.get('/suppliers', getSuppliers);
router.get('/suppliers/:id', getSupplierById);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);

// Ingredients
router.get('/ingredients', getIngredients);
router.get('/ingredients/low-stock', getLowStockIngredients);
router.get('/ingredient-categories', getIngredientCategories);
router.post('/ingredients', createIngredient);
router.put('/ingredients/:id', updateIngredient);
router.post('/ingredients/:id/adjust-stock', adjustStock);

// Stock Receipts
router.get('/stock-receipts', getStockReceipts);
router.get('/stock-receipts/:id', getStockReceiptById);
router.post('/stock-receipts', createStockReceipt);
router.post('/stock-receipts/:id/confirm', confirmStockReceipt);

// Recipes
router.get('/recipes', getAllRecipes);
router.get('/recipes/menu-item/:menuItemId', getRecipeByMenuItem);
router.put('/recipes/menu-item/:menuItemId', upsertRecipe);

// Stock Transactions
router.get('/stock-transactions', getStockTransactions);

// Reports
router.get('/report', getInventoryReport);

// Promotions management
router.post('/promotions', createPromotion);
router.put('/promotions/:id', updatePromotion);

export default router;
