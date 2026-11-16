import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SELF RESTAURANT database seeding...');

  // 1. Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.restaurantArea.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.stockReceiptItem.deleteMany();
  await prisma.stockReceipt.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.ingredientSupplier.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurantConfig.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const defaultPasswordHash = await bcrypt.hash('Password123@', 10);

  // 3. Create Users
  const manager = await prisma.user.create({
    data: {
      email: 'manager@selfrestaurant.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Nguyễn Văn Quản Lý',
      phone: '0901112222',
      role: 'MANAGER',
      isActive: true,
    },
  });

  const chef = await prisma.user.create({
    data: {
      email: 'chef@selfrestaurant.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Trần Bếp Trưởng',
      phone: '0903334444',
      role: 'CHEF',
      isActive: true,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      email: 'cashier@selfrestaurant.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Lê Thị Thu Ngân',
      phone: '0905556666',
      role: 'CASHIER',
      isActive: true,
    },
  });

  const waiter = await prisma.user.create({
    data: {
      email: 'waiter@selfrestaurant.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Hoàng Nhân Viên Phục Vụ',
      phone: '0908889999',
      role: 'WAITER',
      isActive: true,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@selfrestaurant.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Phạm Khách Hàng',
      phone: '0907778888',
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  console.log('✓ Users created: Manager, Waiter, Chef, Cashier, Customer');

  // 4. Restaurant Configs
  const configs = [
    { key: 'RESTAURANT_NAME', value: 'SELF RESTAURANT', description: 'Tên thương hiệu' },
    { key: 'SLOGAN', value: 'Tinh Hoa Ẩm Thực Đương Đại & Dịch Vụ Chu Đáo', description: 'Khẩu hiệu' },
    { key: 'ADDRESS', value: '88 Đường Hoa Lan, Phường 2, Q. Phú Nhuận, TP. Hồ Chí Minh', description: 'Địa chỉ nhà hàng' },
    { key: 'PHONE', value: '028 3888 9999 - Hotline: 0909 123 456', description: 'Số điện thoại liên hệ' },
    { key: 'OPEN_HOURS', value: '10:00 - 23:00 (Thứ 2 - Chủ Nhật)', description: 'Giờ mở cửa' },
    { key: 'WIFI_INFO', value: 'SELF_GUEST / selfrest2026', description: 'Thông tin Wifi' },
    { key: 'VAT_PERCENT', value: '8', description: 'Thuế VAT (%)' },
  ];

  for (const cfg of configs) {
    await prisma.restaurantConfig.create({ data: cfg });
  }

  // 5. Categories
  const catAppetizer = await prisma.category.create({
    data: {
      name: 'Món Khai Vị',
      slug: 'mon-khai-vi',
      description: 'Khởi đầu bữa tiệc với các món khai vị thanh mát, kích thích vị giác',
      displayOrder: 1,
      isActive: true,
    },
  });

  const catMainBeef = await prisma.category.create({
    data: {
      name: 'Món Chính - Bò & Cừu',
      slug: 'bo-va-cuu',
      description: 'Thịt bò thượng hạng Wagyu & Black Angus nhập khẩu chế biến hảo hạng',
      displayOrder: 2,
      isActive: true,
    },
  });

  const catSeafood = await prisma.category.create({
    data: {
      name: 'Hải Sản Tươi Sống',
      slug: 'hai-san-tuoi-song',
      description: 'Hải sản tươi ngon đánh bắt trong ngày, kết hợp sốt bơ tỏi và thảo mộc',
      displayOrder: 3,
      isActive: true,
    },
  });

  const catSoup = await prisma.category.create({
    data: {
      name: 'Soup & Canh Đặc Sắc',
      slug: 'soup-va-canh',
      description: 'Hương vị ninh hầm chậm đậm đà, bổ dưỡng',
      displayOrder: 4,
      isActive: true,
    },
  });

  const catDessert = await prisma.category.create({
    data: {
      name: 'Tráng Miệng Tinh Tế',
      slug: 'trang-mieng',
      description: 'Bánh ngọt và kem thủ công ít ngọt thanh nhẹ',
      displayOrder: 5,
      isActive: true,
    },
  });

  const catDrinks = await prisma.category.create({
    data: {
      name: 'Đồ Uống & Vang Tuyển Chọn',
      slug: 'do-uong-va-vang',
      description: 'Nước ép trái cây tươi, mocktail và vang nhập khẩu cao cấp',
      displayOrder: 6,
      isActive: true,
    },
  });

  console.log('✓ Categories created');

  // 6. Menu Items
  const items = [
    // Khai vị
    {
      categoryId: catAppetizer.id,
      name: 'Salad Cá Hồi Xông Khói Quả Bơ',
      description: 'Cá hồi Na Uy xông khói gỗ sồi, quả bơ sáp, rau rocket hữu cơ và sốt chanh leo chua ngọt',
      price: 185000,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: true,
      preparationTimeMinutes: 10,
    },
    {
      categoryId: catAppetizer.id,
      name: 'Súp Bí Đỏ Hạt Dẻ Bơ Nâu',
      description: 'Bí đỏ Nhật nướng nhuyễn mịn, hạt dẻ giòn thơm, dùng kèm bánh mì nướng bơ tỏi giòn rụm',
      price: 125000,
      imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 12,
    },
    {
      categoryId: catAppetizer.id,
      name: 'Bruschetta Cà Chua Bi & Phô Mai Mozzarella',
      description: 'Bánh mì baguette nướng thơm giòn, cà chua bi tươi, lá húng tây và phô mai béo ngậy',
      price: 115000,
      imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 10,
    },

    // Bò & Cừu
    {
      categoryId: catMainBeef.id,
      name: 'Thăn Nội Bò Wagyu A5 Nướng Đá Núi Lửa',
      description: 'Thịt thăn bò Wagyu vân mỡ cẩm thạch hoàn hảo, dùng kèm sốt nấm Truffle đen và măng tây nướng',
      price: 685000,
      imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: true,
      preparationTimeMinutes: 20,
    },
    {
      categoryId: catMainBeef.id,
      name: 'Sườn Cừu Úc Nướng Thảo Mộc Sốt Rượu Vang Đỏ',
      description: 'Sườn cừu tươi tẩm ướp hương thảo và cỏ xạ hương, khoai tây nghiền mịn và sốt vang Bordeaux đậm vị',
      price: 495000,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: true,
      preparationTimeMinutes: 25,
    },
    {
      categoryId: catMainBeef.id,
      name: 'Thăn Ngoại Bò Black Angus Sốt Tiêu Xanh Phú Quốc',
      description: '250g thăn ngoại bò Mỹ nướng chín tới vừa miệng mọng nước, đậm đà hương tiêu sọ xanh tươi cay nhẹ',
      price: 395000,
      imageUrl: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 18,
    },

    // Hải sản
    {
      categoryId: catSeafood.id,
      name: 'Cá Hồi Áp Chảo Da Giòn Sốt Chanh Bơ',
      description: 'Phi lê cá hồi tươi áp chảo giòn tan phần da, giữ trọn độ ẩm thịt mềm ngậy quyện sốt bơ chanh vàng',
      price: 320000,
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: true,
      preparationTimeMinutes: 15,
    },
    {
      categoryId: catSeafood.id,
      name: 'Tôm Hùm Nướng Phô Mai Bỏ Lò',
      description: 'Nửa con tôm hùm bông nướng cùng sốt kem béo ngậy và lớp phô mai cheddar kéo sợi vàng ươm',
      price: 550000,
      imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: true,
      preparationTimeMinutes: 22,
    },
    {
      categoryId: catSeafood.id,
      name: 'Mì Ý Tôm Sú & Mực Ống Sốt Tỏi Ớt Aglio e Olio',
      description: 'Sợi mì Ý dai al dente xào tôm sú tươi bóc nõn, mực ống giòn, tỏi phi vàng và dầu olive nguyên chất',
      price: 245000,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 15,
    },

    // Canh & Soup
    {
      categoryId: catSoup.id,
      name: 'Súp Hải Sản Kiểu Pháp Bouillabaisse',
      description: 'Nồi súp hải sản trứ danh vùng Provence với cá biển tươi, vẹm xanh, tôm và nước dùng nghệ tây nghệ tây vàng óng',
      price: 280000,
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 20,
    },

    // Tráng miệng
    {
      categoryId: catDessert.id,
      name: 'Bánh Tiramisu Mascarpone Truyền Thống',
      description: 'Bánh quy ladyfingers ngâm cà phê espresso đậm đà cùng rượu Marsala, lớp kem phô mai Mascarpone mềm mịn',
      price: 95000,
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: true,
      preparationTimeMinutes: 8,
    },
    {
      categoryId: catDessert.id,
      name: 'Crème Brûlée Đường Cháy Hương Vani Madagascar',
      description: 'Kem trứng béo ngậy được nướng phủ lớp đường caramel giòn tan phủ trên mặt',
      price: 85000,
      imageUrl: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 8,
    },

    // Đồ uống
    {
      categoryId: catDrinks.id,
      name: 'Nước Ép Cam Vàng & Lựu Đỏ Ép Lạnh',
      description: 'Cam sành hữu cơ và hạt lựu ép chậm 100% nguyên chất, không thêm đường',
      price: 65000,
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 5,
    },
    {
      categoryId: catDrinks.id,
      name: 'Trà Đào Cam Sả Thảo Mộc',
      description: 'Trà ô long thượng hạng ủ lạnh, miếng đào giòn ngọt thơm lừng hương sả và quế hoa',
      price: 60000,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 5,
    },
    {
      categoryId: catDrinks.id,
      name: 'Ly Vang Đỏ Cabernet Sauvignon Chile',
      description: 'Hương thơm anh đào chín mọng, thoang thoảng gỗ sồi và tannin mượt mà êm dịu',
      price: 160000,
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isFeatured: true,
      preparationTimeMinutes: 3,
    },
  ];

  const createdMenuItems: any[] = [];
  for (const it of items) {
    const item = await prisma.menuItem.create({ data: it });
    createdMenuItems.push(item);
  }
  console.log(`✓ Menu items created (${createdMenuItems.length} items)`);

  // 7. Restaurant Areas
  const areaHall = await prisma.restaurantArea.create({
    data: {
      name: 'Sảnh Chính Tầng 1',
      floor: 1,
      description: 'Khu vực trung tâm với ánh sáng ấm cúng, phù hợp cho gia đình và cặp đôi',
    },
  });

  const areaTerrace = await prisma.restaurantArea.create({
    data: {
      name: 'Sân Vườn Terrace',
      floor: 1,
      description: 'Không gian mở thoáng đãng ngắm cảnh cây xanh mát mẻ',
    },
  });

  const areaVip = await prisma.restaurantArea.create({
    data: {
      name: 'Phòng VIP Hoàng Gia Tầng 2',
      floor: 2,
      description: 'Phòng tiệc riêng tư, cách âm sang trọng dành cho đối tác và họp mặt',
    },
  });

  console.log('✓ Restaurant areas created');

  // 8. Restaurant Tables
  const tablesData = [
    { tableCode: 'A01', areaId: areaHall.id, capacity: 4, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-A01-TOKEN' },
    { tableCode: 'A02', areaId: areaHall.id, capacity: 2, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-A02-TOKEN' },
    { tableCode: 'A03', areaId: areaHall.id, capacity: 4, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-A03-TOKEN' },
    { tableCode: 'A04', areaId: areaHall.id, capacity: 6, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-A04-TOKEN' },
    { tableCode: 'A05', areaId: areaHall.id, capacity: 4, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-A05-TOKEN' },
    { tableCode: 'B01', areaId: areaTerrace.id, capacity: 4, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-B01-TOKEN' },
    { tableCode: 'B02', areaId: areaTerrace.id, capacity: 6, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-B02-TOKEN' },
    { tableCode: 'B03', areaId: areaTerrace.id, capacity: 8, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-B03-TOKEN' },
    { tableCode: 'VIP01', areaId: areaVip.id, capacity: 10, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-VIP01-TOKEN' },
    { tableCode: 'VIP02', areaId: areaVip.id, capacity: 12, status: 'AVAILABLE', qrCodeToken: 'QR-TABLE-VIP02-TOKEN' },
  ];

  const createdTables: any[] = [];
  for (const tb of tablesData) {
    const table = await prisma.restaurantTable.create({ data: tb });
    createdTables.push(table);
  }
  console.log(`✓ Restaurant tables created (${createdTables.length} tables)`);

  // 9. Create past completed orders for realistic Revenue & Dashboard reports
  const pastOrder1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-20261020-0001',
      tableId: createdTables[0].id,
      customerId: customer.id,
      status: 'COMPLETED',
      totalAmount: 1190000,
      notes: 'Bàn quen, phục vụ chu đáo',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      completedAt: new Date(Date.now() - 23 * 3600 * 1000),
      items: {
        create: [
          {
            menuItemId: createdMenuItems[3].id, // Wagyu
            quantity: 1,
            unitPrice: 685000,
            subtotal: 685000,
            status: 'SERVED',
          },
          {
            menuItemId: createdMenuItems[6].id, // Salmon
            quantity: 1,
            unitPrice: 320000,
            subtotal: 320000,
            status: 'SERVED',
          },
          {
            menuItemId: createdMenuItems[0].id, // Salad
            quantity: 1,
            unitPrice: 185000,
            subtotal: 185000,
            status: 'SERVED',
          },
        ],
      },
    },
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-20261020-0001',
      orderId: pastOrder1.id,
      totalAmount: 1190000,
      discountAmount: 0,
      finalAmount: 1190000,
      paymentMethod: 'CASH',
      cashierId: cashier.id,
      customerName: customer.fullName,
      tableCode: 'A01',
      createdAt: new Date(Date.now() - 23 * 3600 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      orderId: pastOrder1.id,
      invoiceId: invoice1.id,
      amount: 1190000,
      paymentMethod: 'CASH',
      customerGivenAmount: 1200000,
      changeReturned: 10000,
      status: 'SUCCESS',
      cashierId: cashier.id,
      paidAt: new Date(Date.now() - 23 * 3600 * 1000),
    },
  });

  // Second past order
  const pastOrder2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-20261021-0001',
      tableId: createdTables[1].id,
      customerId: null,
      status: 'COMPLETED',
      totalAmount: 850000,
      notes: 'Khách vãng lai',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      completedAt: new Date(Date.now() - 3 * 3600 * 1000),
      items: {
        create: [
          {
            menuItemId: createdMenuItems[4].id, // Lamb chops
            quantity: 1,
            unitPrice: 495000,
            subtotal: 495000,
            status: 'SERVED',
          },
          {
            menuItemId: createdMenuItems[10].id, // Tiramisu
            quantity: 2,
            unitPrice: 95000,
            subtotal: 190000,
            status: 'SERVED',
          },
          {
            menuItemId: createdMenuItems[14].id, // Wine
            quantity: 1,
            unitPrice: 160000,
            subtotal: 160000,
            status: 'SERVED',
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-20261021-0001',
      orderId: pastOrder2.id,
      totalAmount: 845000,
      discountAmount: 0,
      finalAmount: 845000,
      paymentMethod: 'BANK_TRANSFER',
      cashierId: cashier.id,
      customerName: 'Khách Vãng Lai',
      tableCode: 'A02',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      orderId: pastOrder2.id,
      invoiceId: invoice2.id,
      amount: 845000,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: 'VNPAY_QR_9988221',
      status: 'SUCCESS',
      cashierId: cashier.id,
      paidAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
  });

  // 10. Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: manager.id,
        userEmail: manager.email,
        userRole: manager.role,
        action: 'SYSTEM_INIT',
        entity: 'System',
        entityId: 'ROOT',
        details: 'Khởi tạo hệ thống nhà hàng SELF RESTAURANT thành công',
      },
      {
        userId: cashier.id,
        userEmail: cashier.email,
        userRole: cashier.role,
        action: 'PAYMENT_CONFIRMED',
        entity: 'Payment',
        entityId: pastOrder1.id,
        details: 'Xác nhận thanh toán tiền mặt 1,190,000 VND cho bàn A01',
      },
    ],
  });

  // 11. Initial Suppliers, Ingredients, Recipes, and Promotions
  console.log('📦 Seeding inventory suppliers, ingredients, recipes, and promotions...');

  const sup1 = await prisma.supplier.create({
    data: {
      supplierCode: 'NCC-0001',
      name: 'Công Ty CP Thực Phẩm Sạch Dalat GAP',
      contactName: 'Nguyễn Văn Minh',
      phone: '0912345678',
      email: 'dalatgap@supplier.vn',
      address: 'Đường Mai Anh Đào, Phường 8, TP. Đà Lạt',
      notes: 'Cung cấp rau củ hữu cơ tươi đạt chuẩn VietGAP',
      isActive: true,
    },
  });

  const sup2 = await prisma.supplier.create({
    data: {
      supplierCode: 'NCC-0002',
      name: 'Công Ty TNHH Xuất Nhập Khẩu Thịt Bò KingMeat',
      contactName: 'Trần Thị Hằng',
      phone: '0987654321',
      email: 'order@kingmeat.vn',
      address: 'Khu Công Nghiệp Tân Bình, TP. HCM',
      notes: 'Nhập khẩu trực tiếp bò Wagyu A5 và bò Mỹ Black Angus',
      isActive: true,
    },
  });

  const sup3 = await prisma.supplier.create({
    data: {
      supplierCode: 'NCC-0003',
      name: 'Đại Lý Phân Phối Đồ Uống & Rượu Vang Tân Bình',
      contactName: 'Lê Hoàng Nam',
      phone: '0903332211',
      email: 'wine@tanbinhdist.vn',
      address: '120 Cộng Hòa, Tân Bình, TP. HCM',
      notes: 'Cung cấp bia thủ công, rượu vang nhập khẩu',
      isActive: true,
    },
  });

  const ing1 = await prisma.ingredient.create({
    data: {
      ingredientCode: 'NL-0001',
      name: 'Thịt Bò Wagyu A5',
      unit: 'kg',
      category: 'Thịt & Hải sản',
      currentStock: 25.5,
      reservedStock: 0,
      minimumStock: 5.0,
      lastCostPrice: 850000,
      notes: 'Bò Wagyu vân mỡ cẩm thạch nhập khẩu Nhật Bản',
    },
  });

  const ing2 = await prisma.ingredient.create({
    data: {
      ingredientCode: 'NL-0002',
      name: 'Sườn Bò Mỹ Rút Xương',
      unit: 'kg',
      category: 'Thịt & Hải sản',
      currentStock: 30.0,
      reservedStock: 0,
      minimumStock: 8.0,
      lastCostPrice: 280000,
      notes: 'Sườn bò Black Angus Mỹ',
    },
  });

  const ing3 = await prisma.ingredient.create({
    data: {
      ingredientCode: 'NL-0003',
      name: 'Gạo ST25 Hảo Hạng',
      unit: 'kg',
      category: 'Tinh bột',
      currentStock: 80.0,
      reservedStock: 0,
      minimumStock: 20.0,
      lastCostPrice: 35000,
      notes: 'Gạo thơm ngon nhất thế giới vụ mới',
    },
  });

  const ing4 = await prisma.ingredient.create({
    data: {
      ingredientCode: 'NL-0004',
      name: 'Rau Xà Lách Thủy Canh',
      unit: 'kg',
      category: 'Rau củ',
      currentStock: 18.0,
      reservedStock: 0,
      minimumStock: 5.0,
      lastCostPrice: 45000,
      notes: 'Xà lách Romaine và Lô lô xanh',
    },
  });

  const ing5 = await prisma.ingredient.create({
    data: {
      ingredientCode: 'NL-0005',
      name: 'Sốt Tiêu Đen Phú Quốc',
      unit: 'lít',
      category: 'Gia vị & Sốt',
      currentStock: 15.0,
      reservedStock: 0,
      minimumStock: 3.0,
      lastCostPrice: 90000,
      notes: 'Sốt tiêu đen thơm nồng đặc chế',
    },
  });

  // Link ingredients to suppliers
  await prisma.ingredientSupplier.createMany({
    data: [
      { ingredientId: ing1.id, supplierId: sup2.id, isPreferred: true },
      { ingredientId: ing2.id, supplierId: sup2.id, isPreferred: true },
      { ingredientId: ing3.id, supplierId: sup1.id, isPreferred: true },
      { ingredientId: ing4.id, supplierId: sup1.id, isPreferred: true },
    ],
  });

  // Connect recipes to existing menu items
  const allDishes = await prisma.menuItem.findMany();
  const wagyuDish = allDishes.find((d) => d.name.includes('Wagyu') || d.name.includes('Bò'));
  if (wagyuDish) {
    await prisma.recipe.create({
      data: {
        menuItemId: wagyuDish.id,
        description: 'Bò Wagyu áp chảo nhiệt độ cao, dùng kèm sốt tiêu đen và salad tươi',
        ingredients: {
          create: [
            { ingredientId: ing1.id, quantity: 0.2, unit: 'kg' },
            { ingredientId: ing4.id, quantity: 0.05, unit: 'kg' },
            { ingredientId: ing5.id, quantity: 0.03, unit: 'lít' },
          ],
        },
      },
    });
  }

  // Create Promotions
  await prisma.promotion.createMany({
    data: [
      {
        code: 'GIAM10',
        name: 'Giảm 10% Cho Hóa Đơn Tối Thiểu 200k',
        description: 'Áp dụng cho mọi bàn ăn tại nhà hàng',
        type: 'PERCENT',
        value: 10,
        minimumOrder: 200000,
        maximumDiscount: 100000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 86400000),
        usageLimit: 200,
        isActive: true,
      },
      {
        code: 'WELCOME',
        name: 'Tặng 50k Cho Khách Hàng Mới',
        description: 'Giảm trực tiếp 50,000 đ cho hóa đơn từ 300,000 đ',
        type: 'FIXED_AMOUNT',
        value: 50000,
        minimumOrder: 300000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 86400000),
        usageLimit: 500,
        isActive: true,
      },
      {
        code: 'VIP20',
        name: 'Ưu Đãi Đặc Quyền VIP 20%',
        description: 'Giảm 20% tối đa 300,000 đ cho đơn từ 1,000,000 đ',
        type: 'PERCENT',
        value: 20,
        minimumOrder: 1000000,
        maximumDiscount: 300000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 86400000),
        usageLimit: 50,
        isActive: true,
      },
    ],
  });

  console.log('✓ Completed initial past orders, invoices, payments, and audit logs');
  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
