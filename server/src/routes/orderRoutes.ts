import { Router } from 'express';
import {
  createOrder,
  createQrOrder,
  qrCallWaiter,
  getOrders,
  getOrderById,
  getActiveOrderByTable,
  requestPayment,
  updateOrderStatus,
  updateOrderItemStatus,
} from '../controllers/orderController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// QR Order for customers at table (scanned QR code, no login required)
router.post('/qr-order', createQrOrder);
router.post('/qr-call-waiter', qrCallWaiter);

// Create order: WAITER, MANAGER, CASHIER only (CUSTOMER is strictly forbidden from direct order endpoint)
router.post('/', authenticate, requireRoles('WAITER', 'MANAGER', 'CASHIER'), createOrder);

// Active order by table (used by Waiter, Cashier, Customer & Manager)
router.get('/table/:tableId/active', getActiveOrderByTable);

// Orders list (Customer views their own; Waiter/Chef/Cashier/Manager views all)
router.get('/', authenticate, getOrders);

// Single order details
router.get('/:id', authenticate, getOrderById);

// Request payment: WAITER, CASHIER, MANAGER, CUSTOMER
router.post('/:id/request-payment', authenticate, requireRoles('WAITER', 'CASHIER', 'MANAGER', 'CUSTOMER'), requestPayment);

// Update order status (Waiter, Chef, Cashier, Manager)
router.put('/:id/status', authenticate, requireRoles('WAITER', 'CHEF', 'CASHIER', 'MANAGER'), updateOrderStatus);

// Update individual item status (Waiter, Chef, Manager)
router.put('/items/:itemId/status', authenticate, requireRoles('WAITER', 'CHEF', 'MANAGER'), updateOrderItemStatus);

export default router;
