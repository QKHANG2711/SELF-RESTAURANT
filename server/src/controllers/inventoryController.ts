import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { sendSuccess, sendError } from '../utils/response';

// ===================== HELPER: Tính trạng thái kho =====================
function calcStockStatus(currentStock: number, minimumStock: number) {
  if (currentStock <= 0) return 'OUT_OF_STOCK';
  if (currentStock <= minimumStock) return 'LOW_STOCK';
  return 'NORMAL';
}

// ===================== HELPER: Cập nhật khả dụng món theo kho =====================
export async function updateMenuAvailabilityFromStock() {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { isActive: true },
      include: {
        menuItem: true,
        ingredients: { include: { ingredient: true } },
      },
    });

    for (const recipe of recipes) {
      if (!recipe.menuItem) continue;
      let canServe = true;
      for (const ri of recipe.ingredients) {
        const available = ri.ingredient.currentStock - ri.ingredient.reservedStock;
        if (available < ri.quantity) { canServe = false; break; }
      }
      // Chỉ TẮT món khi thiếu nguyên liệu, KHÔNG tự bật lại (tránh override quyết định của manager)
      if (!canServe && recipe.menuItem.isAvailable) {
        await prisma.menuItem.update({
          where: { id: recipe.menuItem.id },
          data: { isAvailable: false },
        });
      }
    }
  } catch (e) {
    console.error('Error updating menu availability from stock:', e);
  }
}

// ===================== SUPPLIERS =====================

export async function getSuppliers(req: Request, res: Response) {
  try {
    const { search, isActive } = req.query;
    const where: any = {};
    if (search) where.name = { contains: String(search) };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { stockReceipts: true } },
      },
    });
    return sendSuccess(res, suppliers);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

export async function getSupplierById(req: Request, res: Response) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        stockReceipts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { _count: { select: { items: true } } },
        },
      },
    });
    if (!supplier) return sendError(res, 'Nhà cung cấp không tồn tại', 404);
    return sendSuccess(res, supplier);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

const supplierSchema = z.object({
  name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function createSupplier(req: Request, res: Response) {
  try {
    const data = supplierSchema.parse(req.body);
    const count = await prisma.supplier.count();
    const supplierCode = `NCC-${String(count + 1).padStart(4, '0')}`;
    const supplier = await prisma.supplier.create({ data: { ...data, supplierCode } });
    return sendSuccess(res, supplier, 'Tạo nhà cung cấp thành công', 201);
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

export async function updateSupplier(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) return sendError(res, 'Nhà cung cấp không tồn tại', 404);
    const data = supplierSchema.partial().parse(req.body);
    const supplier = await prisma.supplier.update({ where: { id }, data });
    return sendSuccess(res, supplier, 'Cập nhật nhà cung cấp thành công');
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

// ===================== INGREDIENTS =====================

export async function getIngredients(req: Request, res: Response) {
  try {
    const { search, category, lowStock } = req.query;
    const where: any = {};
    if (search) where.name = { contains: String(search) };
    if (category && category !== 'all') where.category = String(category);

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const enriched = ingredients.map(ing => ({
      ...ing,
      availableStock: Math.max(0, ing.currentStock - ing.reservedStock),
      stockStatus: calcStockStatus(ing.currentStock, ing.minimumStock),
    }));

    const result = lowStock === 'true'
      ? enriched.filter(i => i.stockStatus !== 'NORMAL')
      : enriched;

    return sendSuccess(res, result);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

export async function getLowStockIngredients(req: Request, res: Response) {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    const lowStock = ingredients
      .map(ing => ({
        ...ing,
        availableStock: Math.max(0, ing.currentStock - ing.reservedStock),
        stockStatus: calcStockStatus(ing.currentStock, ing.minimumStock),
      }))
      .filter(ing => ing.stockStatus !== 'NORMAL');
    return sendSuccess(res, lowStock);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

const ingredientSchema = z.object({
  name: z.string().min(1, 'Tên nguyên liệu không được để trống'),
  unit: z.string().min(1, 'Đơn vị tính không được để trống'),
  category: z.string().optional(),
  minimumStock: z.number().min(0).default(0),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function createIngredient(req: Request, res: Response) {
  try {
    const data = ingredientSchema.parse(req.body);
    const count = await prisma.ingredient.count();
    const ingredientCode = `NL-${String(count + 1).padStart(4, '0')}`;
    const ingredient = await prisma.ingredient.create({ data: { ...data, ingredientCode } });
    return sendSuccess(res, ingredient, 'Tạo nguyên liệu thành công', 201);
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

export async function updateIngredient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) return sendError(res, 'Nguyên liệu không tồn tại', 404);
    const data = ingredientSchema.partial().parse(req.body);
    const ingredient = await prisma.ingredient.update({ where: { id }, data });
    return sendSuccess(res, ingredient, 'Cập nhật nguyên liệu thành công');
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

export async function adjustStock(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { quantity, notes } = z.object({
      quantity: z.number(),
      notes: z.string().optional(),
    }).parse(req.body);

    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) return sendError(res, 'Nguyên liệu không tồn tại', 404);

    const newStock = ingredient.currentStock + quantity;
    if (newStock < 0) return sendError(res, 'Tồn kho không thể âm sau điều chỉnh', 400);

    await prisma.$transaction([
      prisma.ingredient.update({
        where: { id },
        data: { currentStock: newStock },
      }),
      prisma.stockTransaction.create({
        data: {
          ingredientId: id,
          type: 'ADJUST',
          quantity,
          unit: ingredient.unit,
          beforeStock: ingredient.currentStock,
          afterStock: newStock,
          performedBy: (req as any).user?.email,
          notes: notes || 'Điều chỉnh tồn kho thủ công',
        },
      }),
    ]);

    await updateMenuAvailabilityFromStock();
    return sendSuccess(res, { id, newStock }, 'Điều chỉnh tồn kho thành công');
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

export async function getIngredientCategories(req: Request, res: Response) {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    const categories = ingredients.map(i => i.category).filter(Boolean);
    return sendSuccess(res, categories);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

// ===================== STOCK RECEIPTS =====================

export async function getStockReceipts(req: Request, res: Response) {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    const receipts = await prisma.stockReceipt.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, supplierCode: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, receipts);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

export async function getStockReceiptById(req: Request, res: Response) {
  try {
    const receipt = await prisma.stockReceipt.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
      },
    });
    if (!receipt) return sendError(res, 'Phiếu nhập không tồn tại', 404);
    return sendSuccess(res, receipt);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

const receiptItemSchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
  unit: z.string().min(1),
  costPrice: z.number().min(0, 'Đơn giá không được âm'),
  notes: z.string().optional(),
});

const receiptSchema = z.object({
  supplierId: z.string().uuid(),
  notes: z.string().optional(),
  supplierInvoice: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, 'Phiếu nhập phải có ít nhất 1 nguyên liệu'),
});

export async function createStockReceipt(req: Request, res: Response) {
  try {
    const data = receiptSchema.parse(req.body);
    const count = await prisma.stockReceipt.count();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const receiptNumber = `PN-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    const totalAmount = data.items.reduce((s, i) => s + i.quantity * i.costPrice, 0);

    const receipt = await prisma.stockReceipt.create({
      data: {
        receiptNumber,
        supplierId: data.supplierId,
        totalAmount,
        status: 'DRAFT',
        notes: data.notes,
        supplierInvoice: data.supplierInvoice,
        receivedById: (req as any).user?.id,
        items: {
          create: data.items.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit,
            costPrice: item.costPrice,
            subtotal: item.quantity * item.costPrice,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: { include: { ingredient: { select: { name: true, unit: true } } } },
        supplier: { select: { name: true, supplierCode: true } },
      },
    });
    return sendSuccess(res, receipt, 'Tạo phiếu nhập thành công', 201);
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

export async function confirmStockReceipt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const receipt = await prisma.stockReceipt.findUnique({
      where: { id },
      include: { items: { include: { ingredient: true } } },
    });
    if (!receipt) return sendError(res, 'Phiếu nhập không tồn tại', 404);
    if (receipt.status === 'CONFIRMED') return sendError(res, 'Phiếu nhập này đã được xác nhận trước đó, không thể xác nhận lại', 400);

    await prisma.$transaction(async (tx) => {
      for (const item of receipt.items) {
        const before = item.ingredient.currentStock;
        const after = before + item.quantity;
        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: { currentStock: after, lastCostPrice: item.costPrice },
        });
        await tx.stockTransaction.create({
          data: {
            ingredientId: item.ingredientId,
            type: 'IMPORT',
            quantity: item.quantity,
            unit: item.unit,
            beforeStock: before,
            afterStock: after,
            receiptId: id,
            performedBy: (req as any).user?.email,
            notes: `Nhập kho từ phiếu ${receipt.receiptNumber}`,
          },
        });
      }
      await tx.stockReceipt.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });
    });

    await updateMenuAvailabilityFromStock();
    return sendSuccess(res, { id, receiptNumber: receipt.receiptNumber }, 'Xác nhận phiếu nhập thành công, tồn kho đã được cập nhật');
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

// ===================== RECIPES =====================

export async function getAllRecipes(req: Request, res: Response) {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        menuItem: { select: { id: true, name: true, isAvailable: true, price: true, categoryId: true } },
        ingredients: {
          include: {
            ingredient: {
              select: {
                id: true, name: true, unit: true,
                currentStock: true, reservedStock: true, minimumStock: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = recipes.map(r => ({
      ...r,
      ingredients: r.ingredients.map(ri => ({
        ...ri,
        ingredient: {
          ...ri.ingredient,
          availableStock: Math.max(0, ri.ingredient.currentStock - ri.ingredient.reservedStock),
          stockStatus: calcStockStatus(ri.ingredient.currentStock, ri.ingredient.minimumStock),
        },
      })),
    }));

    return sendSuccess(res, enriched);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

export async function getRecipeByMenuItem(req: Request, res: Response) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { menuItemId: req.params.menuItemId },
      include: {
        menuItem: { select: { name: true, price: true } },
        ingredients: { include: { ingredient: true } },
      },
    });
    return sendSuccess(res, recipe);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

const recipeIngredientSchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.number().positive('Định lượng phải lớn hơn 0'),
  unit: z.string().min(1),
});

const recipeSchema = z.object({
  description: z.string().optional(),
  ingredients: z.array(recipeIngredientSchema).min(0),
});

export async function upsertRecipe(req: Request, res: Response) {
  try {
    const { menuItemId } = req.params;
    const data = recipeSchema.parse(req.body);

    const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!menuItem) return sendError(res, 'Món ăn không tồn tại', 404);

    const recipe = await prisma.$transaction(async (tx) => {
      const existing = await tx.recipe.findUnique({ where: { menuItemId } });
      if (existing) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: existing.id } });
        return tx.recipe.update({
          where: { menuItemId },
          data: {
            description: data.description,
            updatedAt: new Date(),
            ingredients: data.ingredients.length > 0 ? { create: data.ingredients } : undefined,
          },
          include: { ingredients: { include: { ingredient: true } } },
        });
      } else {
        return tx.recipe.create({
          data: {
            menuItemId,
            description: data.description,
            ingredients: data.ingredients.length > 0 ? { create: data.ingredients } : undefined,
          },
          include: { ingredients: { include: { ingredient: true } } },
        });
      }
    });

    await updateMenuAvailabilityFromStock();
    return sendSuccess(res, recipe, 'Cập nhật công thức thành công');
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

// ===================== STOCK TRANSACTIONS =====================

export async function getStockTransactions(req: Request, res: Response) {
  try {
    const { ingredientId, type, limit = '100' } = req.query;
    const where: any = {};
    if (ingredientId) where.ingredientId = String(ingredientId);
    if (type) where.type = String(type);
    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: { ingredient: { select: { name: true, unit: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(String(limit)), 500),
    });
    return sendSuccess(res, transactions);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

// ===================== PROMOTIONS =====================

export async function getPromotions(req: Request, res: Response) {
  try {
    const { isActive } = req.query;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, promotions);
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}

export async function validatePromotion(req: Request, res: Response) {
  try {
    const { code, orderTotal } = req.query;
    if (!code) return sendError(res, 'Thiếu mã khuyến mãi', 400);

    const now = new Date();
    const promo = await prisma.promotion.findFirst({
      where: {
        code: String(code).toUpperCase(),
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!promo) return sendError(res, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn', 400);
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return sendError(res, 'Mã khuyến mãi đã hết lượt sử dụng', 400);
    }

    const total = parseFloat(String(orderTotal || 0));
    if (total < promo.minimumOrder) {
      return sendError(res, `Đơn hàng tối thiểu ${promo.minimumOrder.toLocaleString('vi-VN')} đ mới được áp dụng mã này`, 400);
    }

    let discountAmount = 0;
    if (promo.type === 'PERCENT') {
      discountAmount = (total * promo.value) / 100;
      if (promo.maximumDiscount) discountAmount = Math.min(discountAmount, promo.maximumDiscount);
    } else {
      discountAmount = promo.value;
    }
    discountAmount = Math.round(Math.min(discountAmount, total));

    return sendSuccess(res, {
      promo,
      discountAmount,
      finalAmount: total - discountAmount,
    });
  } catch (e: any) {
    return sendError(res, e.message, 400);
  }
}

const promotionSchema = z.object({
  code: z.string().min(1).transform(s => s.toUpperCase()),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PERCENT', 'FIXED_AMOUNT']),
  value: z.number().positive(),
  minimumOrder: z.number().min(0).default(0),
  maximumDiscount: z.number().positive().optional(),
  startDate: z.string(),
  endDate: z.string(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function createPromotion(req: Request, res: Response) {
  try {
    const data = promotionSchema.parse(req.body);
    const existing = await prisma.promotion.findFirst({ where: { code: data.code } });
    if (existing) return sendError(res, 'Mã khuyến mãi này đã tồn tại', 400);
    const promo = await prisma.promotion.create({
      data: { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
    });
    return sendSuccess(res, promo, 'Tạo khuyến mãi thành công', 201);
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

export async function updatePromotion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) return sendError(res, 'Khuyến mãi không tồn tại', 404);
    const data = promotionSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    const promo = await prisma.promotion.update({ where: { id }, data: updateData });
    return sendSuccess(res, promo, 'Cập nhật khuyến mãi thành công');
  } catch (e: any) {
    return sendError(res, e.errors?.[0]?.message || e.message, 400);
  }
}

// ===================== INVENTORY REPORT =====================

export async function getInventoryReport(req: Request, res: Response) {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const totalIngredients = ingredients.length;
    const outOfStock = ingredients.filter(i => i.currentStock <= 0).length;
    const lowStock = ingredients.filter(i => i.currentStock > 0 && i.currentStock <= i.minimumStock).length;
    const normal = ingredients.filter(i => i.currentStock > i.minimumStock).length;

    const recentTransactions = await prisma.stockTransaction.findMany({
      include: { ingredient: { select: { name: true, unit: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const recentReceipts = await prisma.stockReceipt.findMany({
      include: { supplier: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return sendSuccess(res, {
      summary: { totalIngredients, outOfStock, lowStock, normal },
      alertIngredients: ingredients
        .filter(i => i.currentStock <= i.minimumStock)
        .map(i => ({ ...i, availableStock: Math.max(0, i.currentStock - i.reservedStock), stockStatus: calcStockStatus(i.currentStock, i.minimumStock) })),
      recentTransactions,
      recentReceipts,
    });
  } catch (e: any) {
    return sendError(res, e.message, 500);
  }
}
