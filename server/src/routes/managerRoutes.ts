import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueReport,
  getStaffList,
  createStaffAccount,
  updateStaffAccount,
  getAuditLogs,
  getConfigs,
  updateConfigs,
} from '../controllers/managerController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// All manager routes require authentication AND MANAGER role
router.use(authenticate, requireRoles('MANAGER'));

router.get('/dashboard', getDashboardStats);
router.get('/revenue-report', getRevenueReport);
router.get('/staff', getStaffList);
router.post('/staff', createStaffAccount);
router.put('/staff/:id', updateStaffAccount);
router.get('/audit-logs', getAuditLogs);
router.get('/configs', getConfigs);
router.put('/configs', updateConfigs);

export default router;
