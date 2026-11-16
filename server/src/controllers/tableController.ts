import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from '../middleware/auth';

const areaSchema = z.object({
  name: z.string().min(2, 'Tên khu vực phải từ 2 ký tự trở lên'),
  floor: z.number().int().default(1),
  description: z.string().optional(),
});

const tableSchema = z.object({
  tableCode: z.string().min(2, 'Mã bàn phải từ 2 ký tự trở lên'),
  areaId: z.string().min(1, 'Khu vực không được để trống'),
  capacity: z.number().int().positive('Sức chứa phải lớn hơn 0').default(4),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'SERVING', 'PAYMENT_REQUESTED', 'RESERVED']).default('AVAILABLE'),
});

export async function getAreas(req: Request, res: Response) {
  try {
    const areas = await prisma.restaurantArea.findMany({
      include: {
        _count: {
          select: { tables: true },
        },
      },
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    });
    return sendSuccess(res, areas);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createArea(req: Request, res: Response) {
  try {
    const parse = areaSchema.safeParse(req.body);
    if (!parse.success) return sendError(res, parse.error.errors[0].message, 400);

    const area = await prisma.restaurantArea.create({ data: parse.data });
    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'CREATE_AREA',
      'RestaurantArea',
      area.id,
      `Tạo khu vực: ${area.name} (Tầng ${area.floor})`,
      req.ip
    );
    return sendSuccess(res, area, 'Tạo khu vực thành công', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getTables(req: Request, res: Response) {
  try {
    const { areaId, status } = req.query;
    const where: any = {};

    if (areaId && typeof areaId === 'string' && areaId !== 'all') {
      where.areaId = areaId;
    }
    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    const tables = await prisma.restaurantTable.findMany({
      where,
      include: {
        area: true,
        orders: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            paymentRequestedAt: true,
            _count: { select: { items: true } },
          },
        },
      },
      orderBy: { tableCode: 'asc' },
    });

    const formattedTables = tables.map((t) => {
      const activeOrder = t.orders.length > 0 ? t.orders[0] : null;
      return {
        id: t.id,
        tableCode: t.tableCode,
        areaId: t.areaId,
        areaName: t.area.name,
        floor: t.area.floor,
        capacity: t.capacity,
        status: t.status,
        qrCodeToken: t.qrCodeToken,
        activeOrder: activeOrder
          ? {
              id: activeOrder.id,
              orderNumber: activeOrder.orderNumber,
              status: activeOrder.status,
              totalAmount: activeOrder.totalAmount,
              itemCount: activeOrder._count.items,
              createdAt: activeOrder.createdAt,
              paymentRequestedAt: activeOrder.paymentRequestedAt,
            }
          : null,
      };
    });

    return sendSuccess(res, formattedTables);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getTableByQrToken(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const table = await prisma.restaurantTable.findUnique({
      where: { qrCodeToken: token },
      include: {
        area: true,
        orders: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
          include: {
            items: {
              include: {
                menuItem: {
                  select: { id: true, name: true, imageUrl: true },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!table) {
      return sendError(res, 'Mã QR bàn không hợp lệ hoặc không tồn tại', 404);
    }

    return sendSuccess(res, table);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createTable(req: Request, res: Response) {
  try {
    const parse = tableSchema.safeParse(req.body);
    if (!parse.success) return sendError(res, parse.error.errors[0].message, 400);

    const existing = await prisma.restaurantTable.findUnique({
      where: { tableCode: parse.data.tableCode },
    });
    if (existing) {
      return sendError(res, `Mã bàn ${parse.data.tableCode} đã tồn tại`, 400);
    }

    const qrCodeToken = `QR-TABLE-${parse.data.tableCode}-${Date.now().toString(36).toUpperCase()}`;

    const table = await prisma.restaurantTable.create({
      data: {
        ...parse.data,
        qrCodeToken,
      },
      include: { area: true },
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'CREATE_TABLE',
      'RestaurantTable',
      table.id,
      `Tạo bàn mới: ${table.tableCode} (${table.area.name})`,
      req.ip
    );

    return sendSuccess(res, table, 'Tạo bàn thành công', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateTable(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = tableSchema.partial().safeParse(req.body);
    if (!parse.success) return sendError(res, parse.error.errors[0].message, 400);

    const table = await prisma.restaurantTable.update({
      where: { id },
      data: parse.data,
      include: { area: true },
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'UPDATE_TABLE',
      'RestaurantTable',
      table.id,
      `Cập nhật bàn: ${table.tableCode} (Trạng thái: ${table.status})`,
      req.ip
    );

    return sendSuccess(res, table, 'Cập nhật bàn thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function resetTableStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if table has active uncompleted order
    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId: id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    if (activeOrder) {
      return sendError(res, `Bàn đang có đơn hàng #${activeOrder.orderNumber} chưa thanh toán hoàn tất. Vui lòng xử lý đơn trước khi giải phóng bàn!`, 400);
    }

    const table = await prisma.restaurantTable.update({
      where: { id },
      data: { status: 'AVAILABLE' },
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'RESET_TABLE',
      'RestaurantTable',
      table.id,
      `Thu ngân/Quản lý giải phóng bàn ${table.tableCode} về trạng thái Trống`,
      req.ip
    );

    return sendSuccess(res, table, `Đã giải phóng bàn ${table.tableCode} về trạng thái sẵn sàng`);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
