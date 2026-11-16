import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from '../middleware/auth';
import { consumeStockForOrder } from '../services/inventoryService';

const checkoutSchema = z.object({
  orderId: z.string().min(1, 'Mã đơn hàng không được để trống'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'SIMULATED_QR']).default('CASH'),
  customerGivenAmount: z.number().optional(),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

function generateInvoiceNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomSuffix}`;
}

export async function processCheckout(req: Request, res: Response) {
  try {
    const parse = checkoutSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const { orderId, paymentMethod, customerGivenAmount, discountAmount, notes } = parse.data;

    // 1. Fetch order with items and table
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: { include: { menuItem: true } },
        customer: true,
      },
    });

    if (!order) {
      return sendError(res, 'Không tìm thấy đơn hàng cần thanh toán', 404);
    }

    if (order.status === 'COMPLETED') {
      return sendError(res, 'Đơn hàng này đã được thanh toán hoàn tất trước đó', 400);
    }

    if (order.status === 'CANCELLED') {
      return sendError(res, 'Không thể thanh toán đơn hàng đã bị hủy', 400);
    }

    if (order.items.length === 0) {
      return sendError(res, 'Đơn hàng không có món ăn nào để thanh toán', 400);
    }

    const totalAmount = order.totalAmount;
    const finalAmount = Math.max(0, totalAmount - (discountAmount || 0));

    let changeReturned: number | null = null;
    if (paymentMethod === 'CASH') {
      if (customerGivenAmount === undefined || customerGivenAmount < finalAmount) {
        return sendError(
          res,
          `Số tiền khách đưa (${(customerGivenAmount || 0).toLocaleString('vi-VN')} đ) nhỏ hơn tổng tiền phải trả (${finalAmount.toLocaleString('vi-VN')} đ)`,
          400
        );
      }
      changeReturned = customerGivenAmount - finalAmount;
    }

    const invoiceNumber = generateInvoiceNumber();
    const cashierId = req.user?.id || null;
    const customerName = order.customer?.fullName || 'Khách Tại Bàn';

    // 2. Execute transaction to create invoice, payment, complete order, release table
    const result = await prisma.$transaction(async (tx) => {
      // Re-verify inside transaction to prevent concurrent race condition double checkout
      const orderInTx = await tx.order.findUnique({ where: { id: order.id } });
      if (!orderInTx || orderInTx.status === 'COMPLETED') {
        throw new Error('Đơn hàng này đã được thanh toán hoàn tất trước đó');
      }

      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          totalAmount,
          discountAmount,
          finalAmount,
          paymentMethod,
          cashierId,
          customerName,
          tableCode: order.table.tableCode,
          notes,
        },
      });

      // Create Payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          invoiceId: invoice.id,
          amount: finalAmount,
          paymentMethod,
          customerGivenAmount: paymentMethod === 'CASH' ? customerGivenAmount : finalAmount,
          changeReturned: changeReturned ?? 0,
          status: 'SUCCESS',
          cashierId,
          transactionReference: paymentMethod !== 'CASH' ? `TXN-${Date.now()}` : undefined,
          paidAt: new Date(),
        },
      });

      // Update Order to COMPLETED
      const completedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Consume inventory ingredients for this completed order
      await consumeStockForOrder(tx, order.id, req.user?.email || 'Thu ngân thanh toán');

      // Check if table has any other pending orders before resetting
      const otherOrders = await tx.order.count({
        where: {
          tableId: order.tableId,
          id: { not: order.id },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      });

      if (otherOrders === 0) {
        // Release table back to AVAILABLE
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      return { invoice, payment, completedOrder };
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || 'CASHIER',
      'CONFIRM_PAYMENT',
      'Invoice',
      result.invoice.id,
      `Xác nhận thanh toán ${finalAmount.toLocaleString('vi-VN')} đ (Hóa đơn #${result.invoice.invoiceNumber}, Bàn ${order.table.tableCode})`,
      req.ip
    );

    return sendSuccess(res, {
      invoice: result.invoice,
      payment: result.payment,
      changeReturned,
    }, 'Thanh toán thành công! Bàn đã được tự động giải phóng');
  } catch (error: any) {
    return sendError(res, 'Lỗi khi xử lý thanh toán: ' + error.message, 500);
  }
}

export async function getInvoices(req: Request, res: Response) {
  try {
    const { search, paymentMethod, date, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { tableCode: { contains: search } },
        { customerName: { contains: search } },
      ];
    }

    if (paymentMethod && typeof paymentMethod === 'string' && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
    }

    if (date && typeof date === 'string') {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            include: {
              items: {
                include: { menuItem: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return sendSuccess(res, {
      items: invoices,
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

export async function getInvoiceById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: { include: { area: true } },
            customer: true,
            items: {
              include: { menuItem: true },
            },
            payments: true,
          },
        },
      },
    });

    if (!invoice) {
      return sendError(res, 'Không tìm thấy hóa đơn', 404);
    }

    return sendSuccess(res, invoice);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
