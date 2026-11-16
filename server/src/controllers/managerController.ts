import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from '../middleware/auth';

const createStaffSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
  fullName: z.string().min(2, 'Họ tên phải từ 2 ký tự'),
  phone: z.string().optional(),
  role: z.enum(['WAITER', 'CHEF', 'CASHIER', 'MANAGER']),
});

const updateStaffSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['WAITER', 'CHEF', 'CASHIER', 'MANAGER', 'CUSTOMER']).optional(),
  isActive: z.boolean().optional(),
  newPassword: z.string().min(6).optional(),
});

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Invoices today
    const invoicesToday = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const revenueToday = invoicesToday.reduce((sum, inv) => sum + inv.finalAmount, 0);
    const invoiceCountToday = invoicesToday.length;
    const averageOrderValue = invoiceCountToday > 0 ? Math.round(revenueToday / invoiceCountToday) : 0;

    // 2. Active orders count
    const activeOrdersCount = await prisma.order.count({
      where: {
        status: { in: ['RECEIVED', 'COOKING', 'READY', 'SERVED', 'PAYMENT_REQUESTED'] },
      },
    });

    // 3. Tables count
    const [totalTables, occupiedTables, paymentRequestedTables] = await Promise.all([
      prisma.restaurantTable.count(),
      prisma.restaurantTable.count({ where: { status: { in: ['OCCUPIED', 'SERVING'] } } }),
      prisma.restaurantTable.count({ where: { status: 'PAYMENT_REQUESTED' } }),
    ]);

    // 4. Top selling dishes
    const orderItemsAgg = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: { status: 'COMPLETED' },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topItemDetails = await prisma.menuItem.findMany({
      where: { id: { in: orderItemsAgg.map((i) => i.menuItemId) } },
      select: { id: true, name: true, price: true, imageUrl: true },
    });

    const topSellingDishes = orderItemsAgg.map((agg) => {
      const item = topItemDetails.find((d) => d.id === agg.menuItemId);
      return {
        id: agg.menuItemId,
        name: item?.name || 'Món không rõ',
        price: item?.price || 0,
        imageUrl: item?.imageUrl,
        totalQuantity: agg._sum.quantity || 0,
        totalRevenue: agg._sum.subtotal || 0,
      };
    });

    // 5. Last 7 days revenue trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastInvoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { finalAmount: true, createdAt: true },
    });

    // Aggregate daily
    const dailyMap: { [dateStr: string]: { revenue: number; orderCount: number } } = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateKey = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      dailyMap[dateKey] = { revenue: 0, orderCount: 0 };
    }

    for (const inv of pastInvoices) {
      const dateKey = new Date(inv.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].revenue += inv.finalAmount;
        dailyMap[dateKey].orderCount += 1;
      }
    }

    const revenueChart = Object.keys(dailyMap).map((date) => ({
      date,
      revenue: dailyMap[date].revenue,
      orders: dailyMap[date].orderCount,
    }));

    // 6. Status distribution
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // 7. Low stock alerts (ingredients below minimum)
    const allIngredients = await prisma.ingredient.findMany({ where: { isActive: true } });
    const lowStockAlerts = allIngredients
      .filter(ing => ing.currentStock <= ing.minimumStock)
      .map(ing => ({
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        currentStock: ing.currentStock,
        minimumStock: ing.minimumStock,
        availableStock: Math.max(0, ing.currentStock - ing.reservedStock),
        status: ing.currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      }));

    return sendSuccess(res, {
      revenueToday,
      invoiceCountToday,
      averageOrderValue,
      activeOrdersCount,
      totalTables,
      occupiedTables,
      paymentRequestedTables,
      topSellingDishes,
      revenueChart,
      statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
      lowStockAlerts,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getRevenueReport(req: Request, res: Response) {
  try {
    const { startDate, endDate, paymentMethod } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    if (paymentMethod && typeof paymentMethod === 'string' && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        ...where,
        order: {
          status: 'COMPLETED',
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { orderNumber: true, totalAmount: true, status: true },
        },
      },
    });

    const totalGross = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discountAmount, 0);
    const totalNetRevenue = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

    // Group by payment method
    const paymentMethodsMap: { [method: string]: { count: number; total: number } } = {};
    for (const inv of invoices) {
      if (!paymentMethodsMap[inv.paymentMethod]) {
        paymentMethodsMap[inv.paymentMethod] = { count: 0, total: 0 };
      }
      paymentMethodsMap[inv.paymentMethod].count += 1;
      paymentMethodsMap[inv.paymentMethod].total += inv.finalAmount;
    }

    return sendSuccess(res, {
      totalGross,
      totalDiscount,
      totalNetRevenue,
      totalInvoices: invoices.length,
      paymentMethodsBreakdown: paymentMethodsMap,
      invoices,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getStaffList(req: Request, res: Response) {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ['WAITER', 'CHEF', 'CASHIER', 'MANAGER'] },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, staff);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createStaffAccount(req: Request, res: Response) {
  try {
    const parse = createStaffSchema.safeParse(req.body);
    if (!parse.success) return sendError(res, parse.error.errors[0].message, 400);

    const { email, password, fullName, phone, role } = parse.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 'Email này đã tồn tại trong hệ thống', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        role,
        isActive: true,
      },
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

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'CREATE_STAFF',
      'User',
      newUser.id,
      `Quản lý tạo tài khoản nhân viên mới: ${newUser.fullName} (${newUser.email}) - Vai trò: ${newUser.role}`,
      req.ip
    );

    return sendSuccess(res, newUser, 'Tạo tài khoản nhân viên thành công', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateStaffAccount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = updateStaffSchema.safeParse(req.body);
    if (!parse.success) return sendError(res, parse.error.errors[0].message, 400);

    const dataToUpdate: any = {};
    if (parse.data.fullName) dataToUpdate.fullName = parse.data.fullName;
    if (parse.data.phone !== undefined) dataToUpdate.phone = parse.data.phone;
    if (parse.data.role) dataToUpdate.role = parse.data.role;
    if (parse.data.isActive !== undefined) dataToUpdate.isActive = parse.data.isActive;

    if (parse.data.newPassword) {
      dataToUpdate.passwordHash = await bcrypt.hash(parse.data.newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'UPDATE_STAFF',
      'User',
      updatedUser.id,
      `Cập nhật thông tin/vai trò nhân viên: ${updatedUser.fullName} (${updatedUser.role})`,
      req.ip
    );

    return sendSuccess(res, updatedUser, 'Cập nhật tài khoản nhân viên thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const { page = '1', limit = '30', action, entity } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action && typeof action === 'string' && action !== 'all') {
      where.action = action;
    }
    if (entity && typeof entity === 'string' && entity !== 'all') {
      where.entity = entity;
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return sendSuccess(res, {
      items: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getConfigs(req: Request, res: Response) {
  try {
    const configs = await prisma.restaurantConfig.findMany({
      orderBy: { key: 'asc' },
    });
    return sendSuccess(res, configs);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateConfigs(req: Request, res: Response) {
  try {
    const updates: Array<{ key: string; value: string; description?: string }> = req.body;

    if (!Array.isArray(updates)) {
      return sendError(res, 'Dữ liệu cấu hình không hợp lệ', 400);
    }

    for (const item of updates) {
      await prisma.restaurantConfig.upsert({
        where: { key: item.key },
        update: { value: item.value, description: item.description },
        create: { key: item.key, value: item.value, description: item.description },
      });
    }

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'UPDATE_CONFIGS',
      'RestaurantConfig',
      'ALL',
      'Cập nhật cấu hình thông tin nhà hàng',
      req.ip
    );

    return sendSuccess(res, null, 'Cập nhật cấu hình nhà hàng thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
