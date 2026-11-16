import { Router } from 'express';
import {
  getAreas,
  createArea,
  getTables,
  getTableByQrToken,
  createTable,
  updateTable,
  resetTableStatus,
} from '../controllers/tableController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Areas
router.get('/areas', getAreas);
router.post('/areas', authenticate, requireRoles('MANAGER'), createArea);

// Tables
router.get('/', getTables);
router.get('/qr/:token', getTableByQrToken);
router.post('/', authenticate, requireRoles('MANAGER'), createTable);
router.put('/:id', authenticate, requireRoles('MANAGER'), updateTable);
router.post('/:id/reset', authenticate, requireRoles('CASHIER', 'MANAGER'), resetTableStatus);

export default router;
