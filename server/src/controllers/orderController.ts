import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from '../middleware/auth';
import {
  checkAndReserveStock,
  releaseReservedStock,
  consumeStockForOrder,
} from '../services/inventoryService';

const createOrderSchema = z.object({
  tableId: z.string().min(1, 'Bàn không được để trống'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1, 'Mã món không hợp lệ'),
      quantity: z.number().int().positive('Số lượng món phải lớn hơn 0'),
      notes: z.string().optional(),
    })
  ).min(1, 'Đơn hàng phải có ít nhất 1 món ăn'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'COOKING', 'READY', 'SERVED', 'PAYMENT_REQUESTED', 'COMPLETED', 'CANCELLED']),
  cancelReason: z.string().optional(),
});

const updateItemStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'COOKING', 'READY', 'SERVED', 'CANCELLED']),
});

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
}

export async function createOrder(req: Request, res: Response) {
  try {
    const parse = createOrderSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const { tableId, items, notes } = parse.data;

    // 1. Verify Table exists
    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      return sendError(res, 'Bàn được chọn không tồn tại trên hệ thống', 404);
    }

    // 2. Fetch all menu items from database to verify availability and actual price (NEVER trust client price)
    const menuItemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    const menuMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    // Validate every item
    let calculatedTotal = 0;
    const preparedOrderItems: Array<{
      menuItemId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      notes?: string;
    }> = [];

    for (const item of items) {
      const dbItem = menuMap.get(item.menuItemId);
      if (!dbItem) {
        return sendError(res, `Món ăn có mã ${item.menuItemId} không tồn tại`, 400);
      }
      if (!dbItem.isAvailable) {
        return sendError(res, `Món "${dbItem.name}" hiện đang tạm ngưng phục vụ`, 400);
      }

      const itemSubtotal = dbItem.price * item.quantity;
      calculatedTotal += itemSubtotal;

      preparedOrderItems.push({
        menuItemId: dbItem.id,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        subtotal: itemSubtotal,
        notes: item.notes,
      });
    }

    const orderNumber = generateOrderNumber();
    const customerId = req.user?.role === 'CUSTOMER' ? req.user.id : null;
    const waiterId = ['WAITER', 'MANAGER', 'CASHIER'].includes(req.user?.role || '') ? req.user?.id : null;

    // Check if table currently has an active uncompleted order
    const existingActiveOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        items: true,
      },
    });

    // 3. Execute in Prisma Transaction for absolute consistency
    const resultOrder = await prisma.$transaction(async (tx) => {
      // Check & reserve inventory stock for this order
      await checkAndReserveStock(
        tx,
        preparedOrderItems,
        existingActiveOrder ? existingActiveOrder.orderNumber : orderNumber,
        req.user?.email || 'Phục vụ gọi món'
      );

      if (existingActiveOrder) {
        // APPEND new items to existing active order for this table
        for (const item of preparedOrderItems) {
          await tx.orderItem.create({
            data: {
              orderId: existingActiveOrder.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              notes: item.notes,
              status: 'RECEIVED',
            },
          });
        }

        const newTotalAmount = existingActiveOrder.totalAmount + calculatedTotal;
        const updatedNotes = notes
          ? (existingActiveOrder.notes ? `${existingActiveOrder.notes} | Bổ sung: ${notes}` : notes)
          : existingActiveOrder.notes;

        const updatedOrder = await tx.order.update({
          where: { id: existingActiveOrder.id },
          data: {
            totalAmount: newTotalAmount,
            notes: updatedNotes,
            // If order was in payment requested, reset to cooking/received because new items were added
            status: existingActiveOrder.status === 'PAYMENT_REQUESTED' ? 'COOKING' : existingActiveOrder.status,
            waiterId: waiterId || existingActiveOrder.waiterId,
          },
          include: {
            table: true,
            waiter: { select: { id: true, fullName: true, email: true } },
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        });

        await tx.restaurantTable.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' },
        });

        return updatedOrder;
      } else {
        // Create new order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            tableId,
            customerId,
            waiterId,
            totalAmount: calculatedTotal,
            notes,
            status: 'RECEIVED',
            items: {
              create: preparedOrderItems.map((item) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                notes: item.notes,
                status: 'RECEIVED',
              })),
            },
          },
          include: {
            table: true,
            waiter: { select: { id: true, fullName: true, email: true } },
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        });

        // Update table status to OCCUPIED
        await tx.restaurantTable.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' },
        });

        return newOrder;
      }
    });

    const isAppended = !!existingActiveOrder;
    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || 'WAITER',
      isAppended ? 'APPEND_ORDER' : 'CREATE_ORDER',
      'Order',
      resultOrder.id,
      isAppended
        ? `Nhân viên phục vụ bổ sung ${preparedOrderItems.length} món vào đơn #${resultOrder.orderNumber} bàn ${table.tableCode} (Tổng mới: ${resultOrder.totalAmount.toLocaleString('vi-VN')} đ)`
        : `Nhân viên phục vụ tạo đơn hàng mới #${resultOrder.orderNumber} cho bàn ${table.tableCode} (Tổng: ${calculatedTotal.toLocaleString('vi-VN')} đ)`,
      req.ip
    );

    return sendSuccess(
      res,
      resultOrder,
      isAppended
        ? 'Đã bổ sung món thành công! Đơn hàng đã được chuyển đến bếp.'
        : 'Đã gửi món thành công! Đơn hàng đã được chuyển đến bếp.',
      201
    );
  } catch (error: any) {
    const isClientError = error.message && (error.message.includes('không đủ nguyên liệu') || error.message.includes('tồn tại'));
    return sendError(res, error.message || 'Lỗi khi tạo đơn hàng', isClientError ? 400 : 500);
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const { status, tableId, date, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Customer can only see their own orders
    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.id;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    if (tableId && typeof tableId === 'string' && tableId !== 'all') {
      where.tableId = tableId;
    }

    if (date && typeof date === 'string') {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          table: {
            include: { area: true },
          },
          customer: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          items: {
            include: {
              menuItem: {
                select: { id: true, name: true, imageUrl: true },
              },
            },
          },
          payments: true,
          invoices: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return sendSuccess(res, {
      items: orders,
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

export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: {
          include: { area: true },
        },
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        waiter: {
          select: { id: true, fullName: true, email: true },
        },
        items: {
          include: {
            menuItem: true,
          },
        },
        payments: true,
        invoices: true,
      },
    });

    if (!order) {
      return sendError(res, 'Không tìm thấy đơn hàng', 404);
    }

    // Role check: customer cannot view orders of other customers
    if (req.user?.role === 'CUSTOMER' && order.customerId !== req.user.id) {
      return sendError(res, 'Bạn không có quyền xem đơn hàng này', 403);
    }

    return sendSuccess(res, order);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

// CRITICAL FOR CASHIER & CUSTOMER: Loads active order for a given table with guaranteed items
export async function getActiveOrderByTable(req: Request, res: Response) {
  try {
    const { tableId } = req.params;

    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        table: {
          include: { area: true },
        },
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        waiter: {
          select: { id: true, fullName: true, email: true },
        },
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOrder) {
      return sendSuccess(res, null, 'Bàn hiện chưa có đơn hàng đang hoạt động');
    }

    return sendSuccess(res, activeOrder);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function requestPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true, items: true },
    });

    if (!order) {
      return sendError(res, 'Không tìm thấy đơn hàng', 404);
    }

    if (order.status === 'COMPLETED') {
      return sendError(res, 'Đơn hàng này đã được thanh toán hoàn tất trước đó', 400);
    }

    if (order.status === 'PAYMENT_REQUESTED') {
      return sendError(res, 'Đơn hàng đã được gửi yêu cầu thanh toán trước đó rồi, nhân viên thu ngân đang chuẩn bị xử lý', 400);
    }

    if (order.status === 'CANCELLED') {
      return sendError(res, 'Đơn hàng này đã bị hủy, không thể yêu cầu thanh toán', 400);
    }

    if (order.items.length === 0) {
      return sendError(res, 'Đơn hàng chưa có món ăn nào, không thể yêu cầu thanh toán', 400);
    }

    // If customer is calling, ensure it's their order (or guest)
    if (req.user?.role === 'CUSTOMER' && order.customerId && order.customerId !== req.user.id) {
      return sendError(res, 'Bạn không có quyền yêu cầu thanh toán cho đơn hàng này', 403);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'PAYMENT_REQUESTED',
          paymentRequestedAt: new Date(),
        },
        include: {
          table: true,
          items: { include: { menuItem: true } },
        },
      });

      await tx.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: 'PAYMENT_REQUESTED' },
      });

      return updatedOrder;
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || 'CUSTOMER',
      'REQUEST_PAYMENT',
      'Order',
      order.id,
      `Yêu cầu thanh toán cho bàn ${order.table.tableCode} (Mã đơn: ${order.orderNumber})`,
      req.ip
    );

    return sendSuccess(res, updated, 'Đã gửi yêu cầu thanh toán tới quầy thu ngân. Nhân viên sẽ hỗ trợ bạn ngay!');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = updateOrderStatusSchema.safeParse(req.body);
    if (!parse.success) return sendError(res, parse.error.errors[0].message, 400);

    const { status, cancelReason } = parse.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) return sendError(res, 'Không tìm thấy đơn hàng', 404);

    if (order.status === 'COMPLETED' && status !== 'COMPLETED') {
      return sendError(res, 'Không thể đổi trạng thái của đơn hàng đã thanh toán hoàn tất', 400);
    }

    const dataToUpdate: any = { status };
    if (status === 'COMPLETED') {
      dataToUpdate.completedAt = new Date();
    } else if (status === 'CANCELLED') {
      dataToUpdate.cancelledAt = new Date();
      dataToUpdate.cancelReason = cancelReason || 'Đơn bị hủy bởi nhân viên quản trị';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id },
        data: dataToUpdate,
        include: { table: true, items: { include: { menuItem: true } } },
      });

      // Synchronize table status & inventory stock
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        if (status === 'CANCELLED') {
          await releaseReservedStock(tx, order.id, req.user?.email || 'Hủy đơn');
        } else if (status === 'COMPLETED') {
          await consumeStockForOrder(tx, order.id, req.user?.email || 'Hoàn tất đơn');
        }

        // Check if there are other uncompleted orders on this table
        const otherActiveOrders = await tx.order.count({
          where: {
            tableId: order.tableId,
            id: { not: order.id },
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
        });

        if (otherActiveOrders === 0) {
          await tx.restaurantTable.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' },
          });
        }
      } else if (status === 'SERVED' || status === 'READY') {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'SERVING' },
        });
      }

      return ord;
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'UPDATE_ORDER_STATUS',
      'Order',
      order.id,
      `Cập nhật trạng thái đơn #${order.orderNumber} thành "${status}"`,
      req.ip
    );

    return sendSuccess(res, updated, `Đã cập nhật trạng thái đơn hàng thành ${status}`);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateOrderItemStatus(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    const parse = updateItemStatusSchema.safeParse(req.body);
    if (!parse.success) return sendError(res, parse.error.errors[0].message, 400);

    const { status } = parse.data;

    const dataToUpdate: any = { status };
    if (status === 'COOKING') {
      dataToUpdate.startedCookingAt = new Date();
    } else if (status === 'READY' || status === 'SERVED') {
      dataToUpdate.completedAt = new Date();
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: dataToUpdate,
      include: {
        order: {
          include: { table: true },
        },
        menuItem: true,
      },
    });

    return sendSuccess(res, updatedItem, `Đã cập nhật trạng thái món ${updatedItem.menuItem.name} thành ${status}`);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

const qrOrderSchema = z.object({
  qrToken: z.string().min(1, 'Mã QR bàn không được để trống'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1, 'Mã món không hợp lệ'),
      quantity: z.number().int().positive('Số lượng món phải lớn hơn 0'),
      notes: z.string().optional(),
    })
  ).min(1, 'Đơn hàng phải có ít nhất 1 món ăn'),
});

export async function createQrOrder(req: Request, res: Response) {
  try {
    const parse = qrOrderSchema.safeParse(req.body);
    if (!parse.success) return sendError(res, parse.error.errors[0].message, 400);

    const { qrToken, items, notes } = parse.data;

    // 1. Verify Table by QR token
    const table = await prisma.restaurantTable.findUnique({
      where: { qrCodeToken: qrToken },
    });
    if (!table) {
      return sendError(res, 'Mã QR bàn không hợp lệ hoặc đã hết hạn', 404);
    }

    // 2. Fetch all menu items from database to verify availability and actual price
    const menuItemIds = items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });
    const menuMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    let calculatedTotal = 0;
    const preparedOrderItems: Array<{
      menuItemId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      notes?: string;
    }> = [];

    for (const item of items) {
      const dbItem = menuMap.get(item.menuItemId);
      if (!dbItem) {
        return sendError(res, `Món ăn có mã ${item.menuItemId} không tồn tại`, 400);
      }
      if (!dbItem.isAvailable) {
        return sendError(res, `Món "${dbItem.name}" hiện đang tạm ngưng phục vụ`, 400);
      }

      const itemSubtotal = dbItem.price * item.quantity;
      calculatedTotal += itemSubtotal;
      preparedOrderItems.push({
        menuItemId: dbItem.id,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        subtotal: itemSubtotal,
        notes: item.notes,
      });
    }

    const orderNumber = generateOrderNumber();
    const customerId = (req as any).user?.id || null;

    const existingActiveOrder = await prisma.order.findFirst({
      where: {
        tableId: table.id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: { items: true },
    });

    const resultOrder = await prisma.$transaction(async (tx) => {
      // Check & reserve inventory stock
      await checkAndReserveStock(
        tx,
        preparedOrderItems,
        existingActiveOrder ? existingActiveOrder.orderNumber : orderNumber,
        'Khách tự gọi món qua QR'
      );

      if (existingActiveOrder) {
        // APPEND new items
        for (const item of preparedOrderItems) {
          await tx.orderItem.create({
            data: {
              orderId: existingActiveOrder.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              notes: item.notes,
              status: 'RECEIVED',
            },
          });
        }

        const newTotalAmount = existingActiveOrder.totalAmount + calculatedTotal;
        const updatedNotes = notes
          ? (existingActiveOrder.notes ? `${existingActiveOrder.notes} | Khách gọi thêm: ${notes}` : notes)
          : existingActiveOrder.notes;

        const updatedOrder = await tx.order.update({
          where: { id: existingActiveOrder.id },
          data: {
            totalAmount: newTotalAmount,
            notes: updatedNotes,
            status: existingActiveOrder.status === 'PAYMENT_REQUESTED' ? 'COOKING' : existingActiveOrder.status,
          },
          include: {
            table: true,
            items: { include: { menuItem: true } },
          },
        });

        await tx.restaurantTable.update({
          where: { id: table.id },
          data: { status: 'OCCUPIED' },
        });

        return updatedOrder;
      } else {
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            tableId: table.id,
            customerId,
            totalAmount: calculatedTotal,
            notes,
            status: 'RECEIVED',
            items: {
              create: preparedOrderItems.map((item) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                notes: item.notes,
                status: 'RECEIVED',
              })),
            },
          },
          include: {
            table: true,
            items: { include: { menuItem: true } },
          },
        });

        await tx.restaurantTable.update({
          where: { id: table.id },
          data: { status: 'OCCUPIED' },
        });

        return newOrder;
      }
    });

    return sendSuccess(
      res,
      resultOrder,
      'Đã gửi đơn món thành công qua mã QR! Nhà bếp đang chuẩn bị món cho bạn.',
      201
    );
  } catch (error: any) {
    const isClientError = error.message && (error.message.includes('không đủ nguyên liệu') || error.message.includes('tồn tại'));
    return sendError(res, error.message || 'Lỗi khi gửi đơn qua QR', isClientError ? 400 : 500);
  }
}

export async function qrCallWaiter(req: Request, res: Response) {
  try {
    const { qrToken, reason } = req.body;
    const table = await prisma.restaurantTable.findUnique({
      where: { qrCodeToken: qrToken },
    });
    if (!table) return sendError(res, 'Mã QR bàn không hợp lệ', 404);

    await createAuditLog(
      null,
      null,
      'CUSTOMER',
      'CALL_WAITER',
      'Table',
      table.id,
      `Khách tại bàn ${table.tableCode} gọi nhân viên phục vụ (${reason || 'Hỗ trợ chung'})`,
      req.ip
    );

    return sendSuccess(res, { tableCode: table.tableCode }, 'Đã gọi nhân viên thành công! Nhân viên sẽ đến bàn ngay.');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
