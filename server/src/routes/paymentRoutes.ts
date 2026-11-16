import { Router } from 'express';
import { processCheckout, getInvoices, getInvoiceById } from '../controllers/paymentController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Only CASHIER and MANAGER can process payments or view all invoices
router.post('/checkout', authenticate, requireRoles('CASHIER', 'MANAGER'), processCheckout);
router.get('/invoices', authenticate, requireRoles('CASHIER', 'MANAGER'), getInvoices);
router.get('/invoices/:id', authenticate, requireRoles('CASHIER', 'MANAGER'), getInvoiceById);

export default router;
