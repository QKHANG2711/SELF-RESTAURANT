import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { sendError } from '../utils/response';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'WAITER' | 'CHEF' | 'CASHIER' | 'MANAGER';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'self_restaurant_default_secret_key_2026';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Chưa đăng nhập hoặc thiếu token xác thực', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return sendError(res, 'Tài khoản không tồn tại hoặc đã bị khóa', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as AuthUser['role'],
    };

    next();
  } catch (error) {
    return sendError(res, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401);
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Chưa đăng nhập', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Bạn không có quyền thực hiện thao tác này (Cần quyền: ${allowedRoles.join(', ')})`, 403);
    }

    next();
  };
}

export async function createAuditLog(
  userId: string | null,
  userEmail: string | null,
  userRole: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: string | null,
  ipAddress?: string | null
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        userRole,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}
