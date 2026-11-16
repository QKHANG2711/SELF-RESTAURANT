import prisma from '../prisma';

export interface IngredientRequirement {
  ingredientId: string;
  name: string;
  unit: string;
  required: number;
}

/**
 * Kiểm tra và giữ chỗ nguyên liệu trong transaction khi tạo đơn hoặc thêm món
 */
export async function checkAndReserveStock(
  tx: any,
  items: Array<{ menuItemId: string; quantity: number }>,
  orderRef: string,
  performedBy?: string
) {
  const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];

  // Lấy công thức của các món
  const recipes = await tx.recipe.findMany({
    where: {
      menuItemId: { in: menuItemIds },
      isActive: true,
    },
    include: {
      menuItem: { select: { id: true, name: true } },
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  if (recipes.length === 0) {
    // Không có món nào có công thức -> bỏ qua kiểm tra kho
    return;
  }

  // Tổng hợp số lượng nguyên liệu cần cho toàn bộ đơn
  const neededMap = new Map<
    string,
    { ingredientId: string; name: string; unit: string; required: number; dishName: string }
  >();

  for (const item of items) {
    const recipe = recipes.find((r: any) => r.menuItemId === item.menuItemId);
    if (!recipe) continue;

    for (const ri of recipe.ingredients) {
      const needed = ri.quantity * item.quantity;
      const existing = neededMap.get(ri.ingredientId);
      if (existing) {
        existing.required += needed;
      } else {
        neededMap.set(ri.ingredientId, {
          ingredientId: ri.ingredientId,
          name: ri.ingredient.name,
          unit: ri.ingredient.unit,
          required: needed,
          dishName: recipe.menuItem.name,
        });
      }
    }
  }

  // Kiểm tra tồn kho khả dụng cho từng nguyên liệu
  for (const item of neededMap.values()) {
    const ing = await tx.ingredient.findUnique({
      where: { id: item.ingredientId },
    });

    if (!ing) continue;

    const available = ing.currentStock - ing.reservedStock;
    if (available < item.required) {
      throw new Error(
        `Món "${item.dishName}" không đủ nguyên liệu phục vụ: Thiếu "${item.name}" (Cần: ${item.required} ${item.unit}, Khả dụng: ${Math.max(0, available)} ${item.unit})`
      );
    }
  }

  // Giữ chỗ nguyên liệu (reserve)
  for (const item of neededMap.values()) {
    const ing = await tx.ingredient.findUnique({
      where: { id: item.ingredientId },
    });

    const beforeStock = ing.currentStock;
    await tx.ingredient.update({
      where: { id: item.ingredientId },
      data: {
        reservedStock: { increment: item.required },
      },
    });

    await tx.stockTransaction.create({
      data: {
        ingredientId: item.ingredientId,
        type: 'RESERVE',
        quantity: item.required,
        unit: item.unit,
        beforeStock,
        afterStock: beforeStock, // Tồn kho thực tế chưa giảm, chỉ tăng giữ chỗ
        performedBy: performedBy || 'Hệ thống gọi món',
        notes: `Giữ chỗ ${item.required} ${item.unit} cho đơn ${orderRef}`,
      },
    });
  }
}

/**
 * Giải phóng nguyên liệu đã giữ chỗ khi đơn hàng bị hủy
 */
export async function releaseReservedStock(tx: any, orderId: string, performedBy?: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order || order.items.length === 0) return;

  const menuItemIds = [...new Set(order.items.map((i: any) => i.menuItemId))];
  const recipes = await tx.recipe.findMany({
    where: { menuItemId: { in: menuItemIds }, isActive: true },
    include: {
      ingredients: { include: { ingredient: true } },
    },
  });

  for (const item of order.items) {
    const recipe = recipes.find((r: any) => r.menuItemId === item.menuItemId);
    if (!recipe) continue;

    for (const ri of recipe.ingredients) {
      const releaseAmount = ri.quantity * item.quantity;
      const ing = await tx.ingredient.findUnique({ where: { id: ri.ingredientId } });
      if (!ing) continue;

      const newReserved = Math.max(0, ing.reservedStock - releaseAmount);
      await tx.ingredient.update({
        where: { id: ri.ingredientId },
        data: { reservedStock: newReserved },
      });

      await tx.stockTransaction.create({
        data: {
          ingredientId: ri.ingredientId,
          type: 'RELEASE',
          quantity: -releaseAmount,
          unit: ri.unit,
          beforeStock: ing.currentStock,
          afterStock: ing.currentStock,
          performedBy: performedBy || 'Hủy đơn hàng',
          notes: `Giải phóng ${releaseAmount} ${ri.unit} do hủy đơn #${order.orderNumber}`,
        },
      });
    }
  }
}

/**
 * Tiêu hao kho thực tế khi đơn hàng hoàn tất hoặc thanh toán
 */
export async function consumeStockForOrder(tx: any, orderId: string, performedBy?: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order || order.items.length === 0) return;

  const menuItemIds = [...new Set(order.items.map((i: any) => i.menuItemId))];
  const recipes = await tx.recipe.findMany({
    where: { menuItemId: { in: menuItemIds }, isActive: true },
    include: {
      ingredients: { include: { ingredient: true } },
    },
  });

  for (const item of order.items) {
    const recipe = recipes.find((r: any) => r.menuItemId === item.menuItemId);
    if (!recipe) continue;

    for (const ri of recipe.ingredients) {
      const consumeAmount = ri.quantity * item.quantity;
      const ing = await tx.ingredient.findUnique({ where: { id: ri.ingredientId } });
      if (!ing) continue;

      const beforeStock = ing.currentStock;
      const afterStock = Math.max(0, ing.currentStock - consumeAmount);
      const newReserved = Math.max(0, ing.reservedStock - consumeAmount);

      await tx.ingredient.update({
        where: { id: ri.ingredientId },
        data: {
          currentStock: afterStock,
          reservedStock: newReserved,
        },
      });

      await tx.stockTransaction.create({
        data: {
          ingredientId: ri.ingredientId,
          type: 'CONSUME',
          quantity: -consumeAmount,
          unit: ri.unit,
          beforeStock,
          afterStock,
          performedBy: performedBy || 'Hoàn tất đơn hàng',
          notes: `Tiêu hao ${consumeAmount} ${ri.unit} từ đơn #${order.orderNumber}`,
        },
      });
    }
  }
}
