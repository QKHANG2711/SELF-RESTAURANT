import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import menuRoutes from './routes/menuRoutes';
import tableRoutes from './routes/tableRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import managerRoutes from './routes/managerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import { sendError } from './utils/response';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SELF RESTAURANT API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/inventory', inventoryRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  sendError(res, `Endpoint ${req.method} ${req.originalUrl} không tồn tại`, 404);
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  sendError(res, err.message || 'Lỗi hệ thống nội bộ', 500);
});

export default app;
