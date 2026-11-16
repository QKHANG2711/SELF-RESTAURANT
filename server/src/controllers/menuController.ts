import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from '../middleware/auth';

const menuItemSchema = z.object({
  name: z.string().min(2, 'Tên món phải từ 2 ký tự trở lên'),
  categoryId: z.string().min(1, 'Danh mục không được để trống'),
  description: z.string().optional(),
  price: z.number().positive('Giá món phải là số dương lớn hơn 0'),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  preparationTimeMinutes: z.number().int().nonnegative().default(15),
});

const categorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải từ 2 ký tự trở lên'),
  slug: z.string().min(2, 'Slug danh mục không hợp lệ'),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function getCategories(req: Request, res: Response) {
  try {
    const isManager = req.user?.role === 'MANAGER';
    const whereClause = isManager ? {} : { isActive: true };

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });

    return sendSuccess(res, categories);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const existingSlug = await prisma.category.findUnique({
      where: { slug: parse.data.slug },
    });
    if (existingSlug) {
      return sendError(res, 'Slug danh mục này đã tồn tại', 400);
    }

    const category = await prisma.category.create({
      data: parse.data,
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'CREATE_CATEGORY',
      'Category',
      category.id,
      `Tạo danh mục mới: ${category.name}`,
      req.ip
    );

    return sendSuccess(res, category, 'Tạo danh mục thành công', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = categorySchema.partial().safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const category = await prisma.category.update({
      where: { id },
      data: parse.data,
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'UPDATE_CATEGORY',
      'Category',
      category.id,
      `Cập nhật danh mục: ${category.name}`,
      req.ip
    );

    return sendSuccess(res, category, 'Cập nhật danh mục thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const itemCount = await prisma.menuItem.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      return sendError(res, `Không thể xóa danh mục vì vẫn còn ${itemCount} món ăn liên quan`, 400);
    }

    await prisma.category.delete({ where: { id } });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'DELETE_CATEGORY',
      'Category',
      id,
      'Xóa danh mục',
      req.ip
    );

    return sendSuccess(res, null, 'Xóa danh mục thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getMenuItems(req: Request, res: Response) {
  try {
    const { categoryId, search, minPrice, maxPrice, isFeatured, availableOnly } = req.query;

    const where: any = {};

    if (categoryId && typeof categoryId === 'string' && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice as string) };
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice as string) };
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (availableOnly === 'true') {
      where.isAvailable = true;
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    });

    return sendSuccess(res, items);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getMenuItemById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!item) {
      return sendError(res, 'Không tìm thấy món ăn', 404);
    }

    return sendSuccess(res, item);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createMenuItem(req: Request, res: Response) {
  try {
    const parse = menuItemSchema.safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const item = await prisma.menuItem.create({
      data: parse.data,
      include: { category: true },
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'CREATE_MENU_ITEM',
      'MenuItem',
      item.id,
      `Tạo món ăn: ${item.name} (${item.price.toLocaleString('vi-VN')} đ)`,
      req.ip
    );

    return sendSuccess(res, item, 'Thêm món ăn thành công', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = menuItemSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return sendError(res, parse.error.errors[0].message, 400);
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: parse.data,
      include: { category: true },
    });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'UPDATE_MENU_ITEM',
      'MenuItem',
      item.id,
      `Cập nhật món ăn: ${item.name}`,
      req.ip
    );

    return sendSuccess(res, item, 'Cập nhật món ăn thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if item is used in any orders to preserve historical integrity
    const orderItemCount = await prisma.orderItem.count({
      where: { menuItemId: id },
    });

    if (orderItemCount > 0) {
      // Soft disable
      const updated = await prisma.menuItem.update({
        where: { id },
        data: { isAvailable: false },
      });

      await createAuditLog(
        req.user?.id || null,
        req.user?.email || null,
        req.user?.role || null,
        'DEACTIVATE_MENU_ITEM',
        'MenuItem',
        id,
        `Món ăn đã từng có trong đơn hàng, chuyển trạng thái sang ngưng bán: ${updated.name}`,
        req.ip
      );

      return sendSuccess(res, updated, 'Món đã có trong lịch sử đơn hàng nên hệ thống đã tự động chuyển sang trạng thái ngưng bán an toàn');
    }

    const deleted = await prisma.menuItem.delete({ where: { id } });

    await createAuditLog(
      req.user?.id || null,
      req.user?.email || null,
      req.user?.role || null,
      'DELETE_MENU_ITEM',
      'MenuItem',
      id,
      `Xóa hoàn toàn món ăn: ${deleted.name}`,
      req.ip
    );

    return sendSuccess(res, null, 'Xóa món ăn thành công');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
