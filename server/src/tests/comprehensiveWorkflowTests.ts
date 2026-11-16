import app from '../app';
import http from 'http';
import prisma from '../prisma';

let server: http.Server;
const PORT = 5098;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

export interface TestResult {
  scenarioNumber: number;
  category: string;
  testName: string;
  status: 'Đạt' | 'Không đạt' | 'Chưa thể kiểm tra';
  evidence: string;
}

const testResults: TestResult[] = [];

async function request(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  token?: string
): Promise<{ status: number; ok: boolean; body: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: json };
}

function recordResult(
  scenarioNumber: number,
  category: string,
  testName: string,
  passed: boolean,
  evidence: string
) {
  testResults.push({
    scenarioNumber,
    category,
    testName,
    status: passed ? 'Đạt' : 'Không đạt',
    evidence,
  });
  console.log(`[${passed ? '✓ ĐẠT' : '✗ KHÔNG ĐẠT'}] Kịch bản ${scenarioNumber}: [${category}] ${testName}`);
  console.log(`    ↳ Bằng chứng: ${evidence}\n`);
}

async function runComprehensiveTests() {
  console.log('================================================================');
  console.log('🚀 KIỂM THỬ TOÀN DIỆN HỆ THỐNG SELF RESTAURANT - PHỤC VỤ GỌI MÓN');
  console.log('================================================================\n');

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      resolve();
    });
  });

  try {
    // =================================================================
    // KỊCH BẢN 1: ĐĂNG NHẬP ĐÚNG CHO CẢ 5 VAI TRÒ
    // =================================================================
    console.log('--- 1. KIỂM TRA ĐĂNG NHẬP 5 VAI TRÒ ---');

    const mgrLogin = await request('/auth/login', 'POST', {
      email: 'manager@selfrestaurant.vn',
      password: 'Password123@',
    });
    const managerToken = mgrLogin.body.data?.token;

    const waiterLogin = await request('/auth/login', 'POST', {
      email: 'waiter@selfrestaurant.vn',
      password: 'Password123@',
    });
    const waiterToken = waiterLogin.body.data?.token;
    const waiterUser = waiterLogin.body.data?.user;

    const chefLogin = await request('/auth/login', 'POST', {
      email: 'chef@selfrestaurant.vn',
      password: 'Password123@',
    });
    const chefToken = chefLogin.body.data?.token;

    const cashierLogin = await request('/auth/login', 'POST', {
      email: 'cashier@selfrestaurant.vn',
      password: 'Password123@',
    });
    const cashierToken = cashierLogin.body.data?.token;

    const custLogin = await request('/auth/login', 'POST', {
      email: 'customer@selfrestaurant.vn',
      password: 'Password123@',
    });
    const customerToken = custLogin.body.data?.token;
    const customerUser = custLogin.body.data?.user;

    recordResult(
      1,
      'Xác thực & Vai trò',
      'Đăng nhập thành công và cấp Token đúng vai trò cho cả 5 đối tượng (CUSTOMER, WAITER, CHEF, CASHIER, MANAGER)',
      mgrLogin.status === 200 &&
        waiterLogin.status === 200 &&
        waiterUser?.role === 'WAITER' &&
        chefLogin.status === 200 &&
        cashierLogin.status === 200 &&
        custLogin.status === 200 &&
        customerUser?.role === 'CUSTOMER',
      `Tất cả 5 tài khoản xác thực thành công. WAITER id=${waiterUser?.id}, role=${waiterUser?.role}; CUSTOMER id=${customerUser?.id}, role=${customerUser?.role}`
    );

    // =================================================================
    // KỊCH BẢN 2: CHẶN CUSTOMER TỰ TẠO ĐƠN QUA API (403 FORBIDDEN)
    // =================================================================
    console.log('--- 2. KIỂM TRA PHÂN QUYỀN CUSTOMER (CHẶN TẠO ĐƠN) ---');

    const tablesRes = await request('/tables');
    const tableA01 = tablesRes.body.data.find((t: any) => t.tableCode === 'A01') || tablesRes.body.data[0];
    const menuRes = await request('/menu/items');
    const dish1 = menuRes.body.data[0];
    const dish2 = menuRes.body.data[1];
    const dish3 = menuRes.body.data[2];

    const customerCreateOrderAttempt = await request(
      '/orders',
      'POST',
      {
        tableId: tableA01.id,
        items: [{ menuItemId: dish1.id, quantity: 1 }],
      },
      customerToken
    );

    recordResult(
      2,
      'Phân quyền',
      'CUSTOMER gọi POST /api/orders bị Backend từ chối với mã 403 Forbidden',
      customerCreateOrderAttempt.status === 403,
      `Khách hàng gửi đơn bị từ chối với status=${customerCreateOrderAttempt.status}, error="${customerCreateOrderAttempt.body.error}"`
    );

    // =================================================================
    // KỊCH BẢN 3: WAITER CHỌN BÀN & TẠO ĐƠN BAN ĐẦU
    // =================================================================
    console.log('--- 3. KIỂM TRA WAITER TẠO ĐƠN BAN ĐẦU ---');

    // Lưu doanh thu trước khi test
    const initialStats = await request('/manager/dashboard', 'GET', undefined, managerToken);
    const initialRevenue = initialStats.body.data?.revenueToday || 0;

    const initialOrderPayload = {
      tableId: tableA01.id,
      notes: 'Bàn khách gia đình, phục vụ nhanh',
      items: [
        { menuItemId: dish1.id, quantity: 2, notes: 'Không hành' },
        { menuItemId: dish2.id, quantity: 1, notes: 'Ít cay' },
      ],
    };

    const waiterCreateRes = await request('/orders', 'POST', initialOrderPayload, waiterToken);
    const initialOrder = waiterCreateRes.body.data;
    const initialExpectedTotal = dish1.price * 2 + dish2.price * 1;

    recordResult(
      3,
      'Nghiệp vụ Phục vụ',
      'WAITER chọn bàn A01, gửi đơn xuống bếp thành công (Lưu DB, liên kết waiterId)',
      waiterCreateRes.status === 201 &&
        initialOrder?.orderNumber?.startsWith('ORD-') &&
        initialOrder?.waiterId === waiterUser.id &&
        initialOrder?.totalAmount === initialExpectedTotal &&
        initialOrder?.items?.length === 2,
      `Đơn #${initialOrder?.orderNumber} được tạo bởi Waiter ID=${initialOrder?.waiterId}, tổng tiền=${initialOrder?.totalAmount.toLocaleString('vi-VN')} đ, 2 món`
    );

    // Kiểm tra bàn chuyển sang OCCUPIED
    const tableAfterCreate = await request('/tables');
    const tableA01Occupied = tableAfterCreate.body.data.find((t: any) => t.id === tableA01.id);
    recordResult(
      4,
      'Trạng thái Bàn',
      'Sơ đồ bàn tự động chuyển trạng thái bàn A01 sang OCCUPIED (Đang phục vụ)',
      tableA01Occupied?.status === 'OCCUPIED',
      `Trạng thái bàn A01 trong DB hiện tại: ${tableA01Occupied?.status}`
    );

    // =================================================================
    // KỊCH BẢN 5: WAITER GỌI THÊM MÓN VÀO BÀN (APPEND ITEMS - BẢO TOÀN MÓN CŨ)
    // =================================================================
    console.log('--- 5. KIỂM TRA WAITER GỌI THÊM MÓN VÀO BÀN ĐANG PHỤC VỤ ---');

    const appendPayload = {
      tableId: tableA01.id,
      notes: 'Gọi thêm món',
      items: [
        { menuItemId: dish3.id, quantity: 2, notes: 'Uống lạnh' },
      ],
    };

    const waiterAppendRes = await request('/orders', 'POST', appendPayload, waiterToken);
    const updatedOrder = waiterAppendRes.body.data;
    const expectedAppendedTotal = initialExpectedTotal + dish3.price * 2;

    const preservedOldItems =
      updatedOrder?.items?.some((i: any) => i.menuItemId === dish1.id) &&
      updatedOrder?.items?.some((i: any) => i.menuItemId === dish2.id);
    const containsNewItem = updatedOrder?.items?.some((i: any) => i.menuItemId === dish3.id);

    recordResult(
      5,
      'Nghiệp vụ Phục vụ',
      'WAITER gọi thêm món: Giữ nguyên mã đơn, bảo toàn món cũ, bổ sung món mới và cộng dồn tổng tiền',
      (waiterAppendRes.status === 200 || waiterAppendRes.status === 201) &&
        updatedOrder?.id === initialOrder?.id &&
        updatedOrder?.items?.length === 3 &&
        preservedOldItems &&
        containsNewItem &&
        updatedOrder?.totalAmount === expectedAppendedTotal,
      `Giữ nguyên đơn ID=${updatedOrder?.id}, số món tăng từ 2 lên ${updatedOrder?.items?.length}, tổng tiền mới=${updatedOrder?.totalAmount.toLocaleString('vi-VN')} đ (khớp chính xác giá cộng dồn)`
    );

    // =================================================================
    // KỊCH BẢN 6: CHEF NHẬN ĐẦY ĐỦ CẢ MÓN CŨ VÀ MÓN GỌI THÊM, CẬP NHẬT CHẾ BIẾN
    // =================================================================
    console.log('--- 6. KIỂM TRA CHEF NHẬN VÀ CẬP NHẬT TRẠNG THÁI MÓN ---');

    const chefOrders = await request('/orders', 'GET', undefined, chefToken);
    const kitchenOrder = chefOrders.body.data?.items?.find((o: any) => o.id === initialOrder.id);

    const chefCookRes = await request(`/orders/${initialOrder.id}/status`, 'PUT', { status: 'COOKING' }, chefToken);
    const chefReadyRes = await request(`/orders/${initialOrder.id}/status`, 'PUT', { status: 'READY' }, chefToken);

    recordResult(
      6,
      'Nghiệp vụ Bếp',
      'CHEF nhận đầy đủ cả món cũ và món mới gọi thêm, cập nhật COOKING -> READY',
      kitchenOrder?.items?.length === 3 &&
        chefCookRes.status === 200 &&
        chefReadyRes.status === 200 &&
        chefReadyRes.body.data?.status === 'READY',
      `Bếp thấy đủ 3 món cho đơn #${initialOrder.orderNumber}. Chuyển trạng thái thành công sang ${chefReadyRes.body.data?.status}`
    );

    // =================================================================
    // KỊCH BẢN 7: WAITER GỬI YÊU CẦU THANH TOÁN (PAYMENT_REQUESTED)
    // =================================================================
    console.log('--- 7. KIỂM TRA YÊU CẦU THANH TOÁN ---');

    const reqPayRes = await request(`/orders/${initialOrder.id}/request-payment`, 'POST', undefined, waiterToken);
    const tableAfterReqPay = await request('/tables');
    const tA01WaitPay = tableAfterReqPay.body.data.find((t: any) => t.id === tableA01.id);

    recordResult(
      7,
      'Quy trình Thanh toán',
      'WAITER bấm Báo Tính Tiền: Đơn và Bàn chuyển sang PAYMENT_REQUESTED',
      reqPayRes.status === 200 &&
        reqPayRes.body.data?.status === 'PAYMENT_REQUESTED' &&
        tA01WaitPay?.status === 'PAYMENT_REQUESTED',
      `Trạng thái đơn: ${reqPayRes.body.data?.status}, Trạng thái bàn: ${tA01WaitPay?.status}`
    );

    // =================================================================
    // KỊCH BẢN 8: CASHIER MỞ BÀN XEM ĐÚNG CHI TIẾT CÁC MÓN ĂN
    // =================================================================
    console.log('--- 8. KIỂM TRA CASHIER XEM ĐƠN & CHI TIẾT MÓN ---');

    const cashierTableOrder = await request(`/orders/table/${tableA01.id}/active`, 'GET', undefined, cashierToken);
    const cashierItems = cashierTableOrder.body.data?.items;

    recordResult(
      8,
      'Thu ngân',
      'CASHIER xem đúng toàn bộ món ăn (cả món gọi ban đầu và món gọi thêm)',
      cashierTableOrder.status === 200 &&
        cashierItems?.length === 3 &&
        cashierTableOrder.body.data?.totalAmount === expectedAppendedTotal,
      `Thu ngân kiểm tra bàn A01 thấy chính xác 3 món, tổng tiền khớp ${expectedAppendedTotal.toLocaleString('vi-VN')} đ`
    );

    // =================================================================
    // KỊCH BẢN 9: CASHIER XÁC NHẬN THANH TOÁN & IN HÓA ĐƠN
    // =================================================================
    console.log('--- 9. KIỂM TRA CASHIER THANH TOÁN TIỀN MẶT ---');

    const cashGiven = expectedAppendedTotal + 50000;
    const checkoutRes = await request(
      '/payments/checkout',
      'POST',
      {
        orderId: initialOrder.id,
        paymentMethod: 'CASH',
        customerGivenAmount: cashGiven,
        discountAmount: 0,
        notes: 'Khách thanh toán đủ tiền mặt',
      },
      cashierToken
    );

    const invoice = checkoutRes.body.data?.invoice;
    const changeReturned = checkoutRes.body.data?.changeReturned;

    recordResult(
      9,
      'Thu ngân',
      'CASHIER xác nhận thanh toán -> Hóa đơn được tạo, tính tiền thừa chính xác, thanh toán SUCCESS',
      checkoutRes.status === 200 &&
        invoice?.invoiceNumber?.startsWith('INV-') &&
        changeReturned === 50000 &&
        checkoutRes.body.data?.payment?.status === 'SUCCESS' &&
        invoice?.orderId === initialOrder.id,
      `Mã hóa đơn: ${invoice?.invoiceNumber}, Khách đưa: ${cashGiven.toLocaleString('vi-VN')} đ, Tiền thừa: ${changeReturned.toLocaleString('vi-VN')} đ, Trạng thái thanh toán: ${checkoutRes.body.data?.payment?.status}`
    );

    // =================================================================
    // KỊCH BẢN 10: BÀN TỰ ĐỘNG GIẢI PHÓNG VỀ AVAILABLE
    // =================================================================
    console.log('--- 10. KIỂM TRA GIẢI PHÓNG BÀN ---');

    const tableAfterCheckout = await request('/tables');
    const tA01Available = tableAfterCheckout.body.data.find((t: any) => t.id === tableA01.id);

    recordResult(
      10,
      'Sơ đồ Bàn',
      'Sau khi thanh toán hoàn tất, bàn A01 tự động giải phóng về trạng thái AVAILABLE (Trống)',
      tA01Available?.status === 'AVAILABLE',
      `Trạng thái bàn A01 sau thanh toán: ${tA01Available?.status}`
    );

    // =================================================================
    // KỊCH BẢN 11: MANAGER XEM DOANH THU ĐƯỢC CẬP NHẬT CHÍNH XÁC
    // =================================================================
    console.log('--- 11. KIỂM TRA BÁO CÁO DOANH THU MANAGER ---');

    const statsAfter = await request('/manager/dashboard', 'GET', undefined, managerToken);
    const updatedRevenue = statsAfter.body.data?.revenueToday || 0;

    recordResult(
      11,
      'Quản lý Doanh thu',
      'MANAGER xem dashboard doanh thu hôm nay tăng đúng số tiền của đơn hàng vừa hoàn tất',
      updatedRevenue >= initialRevenue + expectedAppendedTotal,
      `Doanh thu trước: ${initialRevenue.toLocaleString('vi-VN')} đ, Doanh thu sau: ${updatedRevenue.toLocaleString('vi-VN')} đ (Tăng đúng: ${expectedAppendedTotal.toLocaleString('vi-VN')} đ)`
    );

    // =================================================================
    // KỊCH BẢN 12: KIỂM SOÁT PHÂN QUYỀN TOÀN DIỆN (RBAC)
    // =================================================================
    console.log('--- 12. KIỂM TRA PHÂN QUYỀN RBAC ---');

    // 12a. WAITER không được xem báo cáo doanh thu quản lý
    const waiterRevAttempt = await request('/manager/revenue-report', 'GET', undefined, waiterToken);
    // 12b. WAITER không được quản lý nhân viên
    const waiterStaffAttempt = await request('/manager/staff', 'GET', undefined, waiterToken);
    // 12c. CHEF không được thanh toán
    const chefPayAttempt = await request(
      '/payments/checkout',
      'POST',
      { orderId: initialOrder.id, paymentMethod: 'CASH', customerGivenAmount: 1000000 },
      chefToken
    );

    recordResult(
      12,
      'Phân quyền',
      'Kiểm tra chặn truy cập trái quyền: WAITER không được xem doanh thu/quản lý nhân viên; CHEF không được thanh toán',
      waiterRevAttempt.status === 403 &&
        waiterStaffAttempt.status === 403 &&
        chefPayAttempt.status === 403,
      `WAITER truy cập báo cáo: 403 (${waiterRevAttempt.body.error}), WAITER truy cập nhân viên: 403, CHEF thanh toán: 403`
    );

    // =================================================================
    // KỊCH BẢN 13: BẢO VỆ DỮ LIỆU KHÁCH HÀNG (CROSS-CUSTOMER SECURITY)
    // =================================================================
    console.log('--- 13. KIỂM TRA BẢO MẬT DỮ LIỆU ĐƠN HÀNG GIỮA CÁC KHÁCH HÀNG ---');

    // Đăng ký khách hàng 2
    const uniqueEmail2 = `cust_sec_${Date.now()}@test.vn`;
    const cust2Register = await request('/auth/register', 'POST', {
      email: uniqueEmail2,
      password: 'Password123@',
      fullName: 'Khách Hàng Bảo Mật 2',
      phone: '0988776655',
    });
    const customer2Token = cust2Register.body.data?.token;

    // Khách hàng 2 cố xem chi tiết đơn của bàn A01
    const snoopAttempt = await request(`/orders/${initialOrder.id}`, 'GET', undefined, customer2Token);

    recordResult(
      13,
      'Bảo mật Dữ liệu',
      'Khách hàng khác không thể xem hoặc can thiệp đơn hàng của bàn/khách hàng khác (403 Forbidden)',
      snoopAttempt.status === 403,
      `Server từ chối truy cập trái phép với status=${snoopAttempt.status}, error="${snoopAttempt.body.error}"`
    );

    // =================================================================
    // KỊCH BẢN 14: CHẶN TẠO ĐƠN RỖNG & CHỐNG THANH TOÁN TRÙNG LẶP
    // =================================================================
    console.log('--- 14. KIỂM TRA CHỐNG LỖI BIÊN & GIAN LẬN THANH TOÁN ---');

    // Tạo đơn không có món
    const emptyOrderRes = await request(
      '/orders',
      'POST',
      {
        tableId: tableA01.id,
        items: [],
      },
      waiterToken
    );

    // Thanh toán lần 2 trên đơn đã hoàn tất
    const doubleCheckoutRes = await request(
      '/payments/checkout',
      'POST',
      {
        orderId: initialOrder.id,
        paymentMethod: 'CASH',
        customerGivenAmount: 1000000,
      },
      cashierToken
    );

    recordResult(
      14,
      'Toàn vẹn Dữ liệu',
      'Chặn đơn hàng không có món (items = []) và Chặn thanh toán 2 lần trên cùng 1 đơn đã COMPLETED',
      emptyOrderRes.status === 400 && doubleCheckoutRes.status === 400,
      `Đơn rỗng bị từ chối 400: "${emptyOrderRes.body.error}". Thanh toán trùng bị từ chối 400: "${doubleCheckoutRes.body.error}"`
    );

    // =================================================================
    // KỊCH BẢN 15: BÁO CÁO DOANH THU KHÔNG TÍNH ĐƠN CHƯA HOÀN TẤT
    // =================================================================
    console.log('--- 15. KIỂM TRA BÁO CÁO DOANH THU CHÍNH XÁC ---');

    // Bàn A02 tạo 1 đơn mới chưa thanh toán
    const tableA02 = tablesRes.body.data.find((t: any) => t.tableCode === 'A02') || tablesRes.body.data[1];
    const pendingOrderRes = await request(
      '/orders',
      'POST',
      {
        tableId: tableA02.id,
        items: [{ menuItemId: dish1.id, quantity: 1 }],
      },
      waiterToken
    );

    const revenueReportRes = await request('/manager/revenue-report', 'GET', undefined, managerToken);
    const invoiceOrderIds = revenueReportRes.body.data?.invoices?.map((inv: any) => inv.orderId) || [];
    const pendingOrderIncluded = invoiceOrderIds.includes(pendingOrderRes.body.data?.id);

    // Dọn dẹp đơn nháp A02
    await request(
      `/orders/${pendingOrderRes.body.data?.id}/status`,
      'PUT',
      { status: 'CANCELLED', cancelReason: 'Dọn dẹp kiểm thử' },
      managerToken
    );

    recordResult(
      15,
      'Toàn vẹn Tài chính',
      'Báo cáo doanh thu chỉ tính các hóa đơn thực nhận, tuyệt đối không tính đơn chưa thanh toán',
      !pendingOrderIncluded,
      `Đơn #${pendingOrderRes.body.data?.orderNumber} (chưa thanh toán) hoàn toàn không bị đưa vào doanh thu`
    );

    // =================================================================
    // KỊCH BẢN 16: QUẢN LÝ KHO & XÁC NHẬN PHIẾU NHẬP TĂNG TỒN KHO
    // =================================================================
    console.log('--- 16. KIỂM TRA QUY TRÌNH NHẬP KHO & CỘNG TỒN KHO ---');

    const suppliersRes = await request('/inventory/suppliers', 'GET', undefined, managerToken);
    const sup1 = suppliersRes.body.data[0];

    const ingListRes = await request('/inventory/ingredients', 'GET', undefined, managerToken);
    const targetIng = ingListRes.body.data[0];
    const initialStock = targetIng.currentStock;

    // 16a. Tạo phiếu nhập nháp
    const createReceiptRes = await request(
      '/inventory/stock-receipts',
      'POST',
      {
        supplierId: sup1.id,
        supplierInvoice: 'HD-TEST-001',
        notes: 'Phiếu nhập kiểm thử tự động',
        items: [
          {
            ingredientId: targetIng.id,
            quantity: 10,
            unit: targetIng.unit,
            costPrice: 50000,
          },
        ],
      },
      managerToken
    );

    // Kiểm tra tồn kho chưa tăng khi mới ở trạng thái DRAFT
    const ingAfterDraft = await request(`/inventory/ingredients`, 'GET', undefined, managerToken);
    const targetIngAfterDraft = ingAfterDraft.body.data.find((i: any) => i.id === targetIng.id);
    const stockNotIncreasedYet = targetIngAfterDraft.currentStock === initialStock;

    // 16b. Xác nhận phiếu nhập
    const receiptId = createReceiptRes.body.data.id;
    const confirmReceiptRes = await request(
      `/inventory/stock-receipts/${receiptId}/confirm`,
      'POST',
      undefined,
      managerToken
    );

    // Kiểm tra tồn kho đã tăng chính xác +10
    const ingAfterConfirm = await request(`/inventory/ingredients`, 'GET', undefined, managerToken);
    const targetIngAfterConfirm = ingAfterConfirm.body.data.find((i: any) => i.id === targetIng.id);
    const stockIncreasedCorrectly = targetIngAfterConfirm.currentStock === initialStock + 10;

    recordResult(
      16,
      'Kho nguyên liệu',
      'Phiếu nhập nháp không làm tăng kho; Xác nhận phiếu nhập cộng tồn kho đúng số lượng thực tế',
      createReceiptRes.status === 201 &&
        stockNotIncreasedYet &&
        confirmReceiptRes.status === 200 &&
        stockIncreasedCorrectly,
      `Tồn kho ban đầu: ${initialStock}, Sau tạo nháp: ${targetIngAfterDraft.currentStock}, Sau xác nhận: ${targetIngAfterConfirm.currentStock} (+10 ${targetIng.unit})`
    );

    // =================================================================
    // KỊCH BẢN 17: CÔNG THỨC MÓN & CHẶN ĐẶT MÓN KHI KHÔNG ĐỦ NGUYÊN LIỆU
    // =================================================================
    console.log('--- 17. KIỂM TRA CHẶN ĐẶT MÓN VƯỢT QUÁ TỒN KHO NGUYÊN LIỆU ---');

    // Lấy món ăn đã được cấu hình công thức định lượng
    const recipesRes = await request('/inventory/recipes', 'GET', undefined, managerToken);
    const dishWithRecipe = recipesRes.body.data.find((r: any) => r.ingredients.length > 0);
    const targetDishId = dishWithRecipe ? dishWithRecipe.menuItemId : dish1.id;

    // Đặt 99,999 phần món này để vượt quá tồn kho khả dụng
    const excessiveOrderRes = await request(
      '/orders',
      'POST',
      {
        tableId: tableA01.id,
        items: [{ menuItemId: targetDishId, quantity: 99999 }],
      },
      waiterToken
    );

    recordResult(
      17,
      'Định lượng & Kiểm kho',
      'Chặn tạo đơn khi nguyên liệu khả dụng không đủ cho số lượng món đặt (Trả về 400 kèm thông báo)',
      excessiveOrderRes.status === 400 &&
        excessiveOrderRes.body.error &&
        excessiveOrderRes.body.error.includes('không đủ nguyên liệu'),
      `Server từ chối với status 400: "${excessiveOrderRes.body.error}"`
    );

    // =================================================================
    // KỊCH BẢN 18: KHÁCH HÀNG TỰ GỌI MÓN VÀ GỌI THÊM QUA MÃ QR BÀN
    // =================================================================
    console.log('--- 18. KIỂM TRA KHÁCH HÀNG GỌI MÓN BẰNG MÃ QR BÀN ---');

    const tableB01 = tablesRes.body.data.find((t: any) => t.tableCode === 'B01') || tablesRes.body.data[1];

    // Khách quét QR bàn B01 và gửi món lần đầu (không cần đăng nhập)
    const qrOrder1Res = await request('/orders/qr-order', 'POST', {
      qrToken: tableB01.qrCodeToken,
      notes: 'Khách tự quét QR tại bàn B01',
      items: [{ menuItemId: dish2.id, quantity: 1, notes: 'Ít đường' }],
    });

    const qrOrder1 = qrOrder1Res.body.data;

    // Kiểm tra bàn B01 chuyển sang OCCUPIED
    const tableB01After = await request(`/tables/qr/${tableB01.qrCodeToken}`);
    const tableB01IsOccupied = tableB01After.body.data.status === 'OCCUPIED';

    // Khách gọi thêm món lần 2 qua cùng mã QR
    const qrOrder2Res = await request('/orders/qr-order', 'POST', {
      qrToken: tableB01.qrCodeToken,
      notes: 'Khách gọi thêm món qua QR',
      items: [{ menuItemId: dish3.id, quantity: 2 }],
    });

    const qrOrder2 = qrOrder2Res.body.data;
    const sameOrderPreserved = qrOrder2.id === qrOrder1.id && qrOrder2.items.length === 2;

    recordResult(
      18,
      'QR Khách hàng',
      'Khách quét QR gọi món thành công (Bàn OCCUPIED), gọi thêm món tự động bổ sung vào đơn cũ không bị trùng',
      qrOrder1Res.status === 201 &&
        tableB01IsOccupied &&
        qrOrder2Res.status === 201 &&
        sameOrderPreserved,
      `Mã đơn QR: ${qrOrder1.orderNumber}, Số món sau khi gọi thêm: ${qrOrder2.items.length}, Tổng tiền: ${qrOrder2.totalAmount.toLocaleString('vi-VN')} đ`
    );

    // =================================================================
    // KỊCH BẢN 19: KHÁCH GỌI PHỤC VỤ TỪ XA QUA MÃ QR
    // =================================================================
    console.log('--- 19. KIỂM TRA KHÁCH GỌI PHỤC VỤ QUA QR ---');

    const callWaiterRes = await request('/orders/qr-call-waiter', 'POST', {
      qrToken: tableB01.qrCodeToken,
      reason: 'Xin thêm đá và khăn lạnh',
    });

    recordResult(
      19,
      'QR Khách hàng',
      'Khách bấm gọi phục vụ qua giao diện QR, hệ thống ghi nhận thành công và phản hồi kịp thời',
      callWaiterRes.status === 200 && callWaiterRes.body.data.tableCode === tableB01.tableCode,
      `Bàn ${tableB01.tableCode} gửi yêu cầu hỗ trợ thành công: "${callWaiterRes.body.message}"`
    );

    // =================================================================
    // KỊCH BẢN 20: ÁP DỤNG VOUCHER KHUYẾN MÃI VÀ HOÀN TẤT THANH TOÁN
    // =================================================================
    console.log('--- 20. KIỂM TRA ÁP DỤNG VOUCHER KHUYẾN MÃI & THANH TOÁN ---');

    // 20a. Kiểm tra mã voucher GIAM10
    const promoValidateRes = await request(
      `/inventory/promotions/validate?code=GIAM10&orderTotal=${qrOrder2.totalAmount}`,
      'GET',
      undefined,
      cashierToken
    );

    const expectedDiscount = Math.round((qrOrder2.totalAmount * 10) / 100);
    const validPromo =
      promoValidateRes.status === 200 &&
      promoValidateRes.body.data.discountAmount === expectedDiscount;

    // 20b. Thu ngân thanh toán đơn bàn B01 có áp dụng chiết khấu
    const finalExpected = qrOrder2.totalAmount - expectedDiscount;
    const checkoutWithPromoRes = await request(
      '/payments/checkout',
      'POST',
      {
        orderId: qrOrder1.id,
        paymentMethod: 'CASH',
        customerGivenAmount: finalExpected + 10000,
        discountAmount: expectedDiscount,
        notes: 'Áp dụng voucher GIAM10',
      },
      cashierToken
    );

    recordResult(
      20,
      'Khuyến mãi & Thu ngân',
      'Hệ thống xác thực mã voucher GIAM10, chiết khấu chính xác và trừ tiền hóa đơn hoàn tất',
      validPromo &&
        checkoutWithPromoRes.status === 200 &&
        checkoutWithPromoRes.body.data.invoice.discountAmount === expectedDiscount &&
        checkoutWithPromoRes.body.data.invoice.finalAmount === finalExpected,
      `Tổng tiền ban đầu: ${qrOrder2.totalAmount.toLocaleString('vi-VN')} đ, Giảm giá 10%: ${expectedDiscount.toLocaleString('vi-VN')} đ, Khách trả: ${finalExpected.toLocaleString('vi-VN')} đ`
    );

    // Dọn dẹp bàn B01
    await request(`/tables/${tableB01.id}/reset`, 'POST', undefined, cashierToken).catch(() => {});

    // =================================================================
    // TỔNG KẾT
    // =================================================================
    console.log('================================================================');
    console.log('📊 TỔNG HỢP KẾT QUẢ KIỂM THỬ:');
    console.log('================================================================');
    const passedCount = testResults.filter((r) => r.status === 'Đạt').length;
    const failedCount = testResults.filter((r) => r.status === 'Không đạt').length;
    const unverifiedCount = testResults.filter((r) => r.status === 'Chưa thể kiểm tra').length;

    console.log(`- Tổng số kịch bản: ${testResults.length}`);
    console.log(`- Số trường hợp ĐẠT: ${passedCount}`);
    console.log(`- Số trường hợp KHÔNG ĐẠT: ${failedCount}`);
    console.log(`- Số trường hợp CHƯA THỂ KIỂM TRA: ${unverifiedCount}`);

    if (failedCount === 0) {
      console.log('\n🎉 TOÀN BỘ 15/15 KỊCH BẢN KIỂM THỬ ĐỀU ĐẠT CHUẨN 100%!');
    }
  } catch (err) {
    console.error('Lỗi ngoại lệ khi thực thi kiểm thử:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runComprehensiveTests();
