import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'self_restaurant_default_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const registerSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  fullName: z.string().min(2, 'Họ tên phải từ 2 ký tự trở lên'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải từ 6 ký tự trở lên'),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải từ 2 ký tự trở lên'),
  phone: z.string().optional(),
});

export async function register(req: Request, res: Response) {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const { email, password, fullName, phone } = parse.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'Email này đã được sử dụng', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Public registration is ALWAYS forced to CUSTOMER role for security
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        role: 'CUSTOMER',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await createAuditLog(
      user.id,
      user.email,
      user.role,
      'REGISTER',
      'User',
      user.id,
      'Khách hàng đăng ký tài khoản mới',
      req.ip
    );

    return sendSuccess(res, { user, token }, 'Đăng ký tài khoản thành công', 201);
  } catch (error: any) {
    return sendError(res, 'Lỗi khi đăng ký tài khoản: ' + error.message, 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const { email, password } = parse.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'Tài khoản hoặc mật khẩu không chính xác', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Tài khoản của bạn đã bị tạm khóa, vui lòng liên hệ quản lý', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Tài khoản hoặc mật khẩu không chính xác', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };

    await createAuditLog(
      user.id,
      user.email,
      user.role,
      'LOGIN',
      'User',
      user.id,
      `Đăng nhập thành công với vai trò ${user.role}`,
      req.ip
    );

    return sendSuccess(res, { user: safeUser, token }, 'Đăng nhập thành công');
  } catch (error: any) {
    return sendError(res, 'Lỗi khi đăng nhập: ' + error.message, 500);
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Chưa đăng nhập', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'Không tìm thấy người dùng', 404);
    }

    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) return sendError(res, 'Chưa đăng nhập', 401);

    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: parse.data.fullName,
        phone: parse.data.phone,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, updated, 'Cập nhật thông tin thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) return sendError(res, 'Chưa đăng nhập', 401);

    const parse = changePasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return sendError(res, 'Không tìm thấy người dùng', 404);

    const isMatch = await bcrypt.compare(parse.data.currentPassword, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Mật khẩu hiện tại không chính xác', 400);
    }

    const newPasswordHash = await bcrypt.hash(parse.data.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await createAuditLog(
      user.id,
      user.email,
      user.role,
      'CHANGE_PASSWORD',
      'User',
      user.id,
      'Người dùng thay đổi mật khẩu thành công',
      req.ip
    );

    return sendSuccess(res, null, 'Đổi mật khẩu thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
