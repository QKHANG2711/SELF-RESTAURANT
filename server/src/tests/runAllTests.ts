import app from '../app';
import http from 'http';
import prisma from '../prisma';

let server: http.Server;
const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

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

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('🚀 Starting SELF RESTAURANT End-to-End Automated Tests...\n');

  // Start test server
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      resolve();
    });
  });

  try {
    // TEST 1: Health check
    console.log('--- TEST GROUP 1: Health Check ---');
    const health = await request('/health');
    assert(health.status === 200 && health.body.status === 'ok', 'API health check responds 200 OK');

    // TEST 2: Authentication
    console.log('\n--- TEST GROUP 2: Authentication & RBAC ---');
    // Wrong password
    const wrongLogin = await request('/auth/login', 'POST', {
      email: 'manager@selfrestaurant.vn',
      password: 'WrongPassword!',
    });
    assert(wrongLogin.status === 401, 'Invalid password returns 401 Unauthorized');

    // Login Manager
    const mgrLogin = await request('/auth/login', 'POST', {
      email: 'manager@selfrestaurant.vn',
      password: 'Password123@',
    });
    assert(mgrLogin.status === 200 && mgrLogin.body.data.token, 'Manager login successful and returns JWT');
    const managerToken = mgrLogin.body.data.token;

    // Login Chef
    const chefLogin = await request('/auth/login', 'POST', {
      email: 'chef@selfrestaurant.vn',
      password: 'Password123@',
    });
    assert(chefLogin.status === 200, 'Chef login successful');
    const chefToken = chefLogin.body.data.token;

    // Login Cashier
    const cashierLogin = await request('/auth/login', 'POST', {
      email: 'cashier@selfrestaurant.vn',
      password: 'Password123@',
    });
    assert(cashierLogin.status === 200, 'Cashier login successful');
    const cashierToken = cashierLogin.body.data.token;

    // Login Customer
    const custLogin = await request('/auth/login', 'POST', {
      email: 'customer@selfrestaurant.vn',
      password: 'Password123@',
    });
    assert(custLogin.status === 200, 'Customer login successful');
    const customerToken = custLogin.body.data.token;

    // RBAC: Customer trying to access manager staff list
    const customerForbidden = await request('/manager/staff', 'GET', undefined, customerToken);
    assert(customerForbidden.status === 403, 'Customer cannot access Manager API (403 Forbidden)');

    // RBAC: Chef trying to checkout
    const chefForbidden = await request('/payments/checkout', 'POST', { orderId: 'dummy' }, chefToken);
    assert(chefForbidden.status === 403, 'Chef cannot confirm checkout (403 Forbidden)');

    // RBAC: Cashier trying to create staff
    const cashierForbidden = await request('/manager/staff', 'POST', { email: 'test@test.com' }, cashierToken);
    assert(cashierForbidden.status === 403, 'Cashier cannot create staff accounts (403 Forbidden)');

    // RBAC: Manager can access manager stats
    const managerAllowed = await request('/manager/dashboard', 'GET', undefined, managerToken);
    assert(managerAllowed.status === 200, 'Manager can access dashboard stats');

    // TEST 3: Business Workflow (Create Order -> Cook -> Request Payment -> Cashier Checkout -> Table Released)
    console.log('\n--- TEST GROUP 3: Complete Restaurant Business Flow ---');

    // Get an available table (e.g. A03)
    const tablesRes = await request('/tables');
    assert(tablesRes.status === 200 && tablesRes.body.data.length > 0, 'Can fetch tables list');
    const targetTable = tablesRes.body.data.find((t: any) => t.tableCode === 'A03') || tablesRes.body.data[0];

    // Get menu items
    const menuRes = await request('/menu/items');
    assert(menuRes.status === 200 && menuRes.body.data.length >= 2, 'Can fetch menu items');
    const item1 = menuRes.body.data[0];
    const item2 = menuRes.body.data[1];

    // Customer places order for Table A03
    const orderPayload = {
      tableId: targetTable.id,
      notes: 'Bàn ít đường, không cay',
      items: [
        { menuItemId: item1.id, quantity: 2, notes: 'Ít đá' },
        { menuItemId: item2.id, quantity: 1, notes: 'Chín vừa' },
      ],
    };

    const createOrderRes = await request('/orders', 'POST', orderPayload, customerToken);
    assert(createOrderRes.status === 201, 'Order created successfully');
    const createdOrder = createOrderRes.body.data;
    assert(createdOrder.items.length === 2, 'Created order has exactly 2 order items');
    assert(createdOrder.status === 'RECEIVED', 'Initial order status is RECEIVED');

    // Verify Table status is now OCCUPIED
    const tableAfterOrder = await request('/tables');
    const updatedTable = tableAfterOrder.body.data.find((t: any) => t.id === targetTable.id);
    assert(updatedTable.status === 'OCCUPIED', 'Table status changed to OCCUPIED after placing order');

    // CRITICAL TEST: Active Order By Table for Cashier & Kitchen
    const activeOrderRes = await request(`/orders/table/${targetTable.id}/active`);
    assert(activeOrderRes.status === 200 && activeOrderRes.body.data !== null, 'Active order by table returns data');
    assert(
      activeOrderRes.body.data.items && activeOrderRes.body.data.items.length === 2,
      'Active order includes full items list (Prevents "bàn có món nhưng báo chưa có món" bug)'
    );

    // Chef updates order status to COOKING then READY
    const cookRes = await request(`/orders/${createdOrder.id}/status`, 'PUT', { status: 'COOKING' }, chefToken);
    assert(cookRes.status === 200 && cookRes.body.data.status === 'COOKING', 'Chef transitions order to COOKING');

    const readyRes = await request(`/orders/${createdOrder.id}/status`, 'PUT', { status: 'READY' }, chefToken);
    assert(readyRes.status === 200 && readyRes.body.data.status === 'READY', 'Chef transitions order to READY');

    // Customer requests payment
    const reqPayRes = await request(`/orders/${createdOrder.id}/request-payment`, 'POST', undefined, customerToken);
    assert(reqPayRes.status === 200, 'Customer successfully requests payment');
    assert(reqPayRes.body.data.status === 'PAYMENT_REQUESTED', 'Order status is now PAYMENT_REQUESTED');

    // Verify table status is PAYMENT_REQUESTED
    const tableWaitPay = await request('/tables');
    const tWait = tableWaitPay.body.data.find((t: any) => t.id === targetTable.id);
    assert(tWait.status === 'PAYMENT_REQUESTED', 'Table status is now PAYMENT_REQUESTED for Cashier alert');

    // Cashier opens table and processes checkout
    const finalAmount = createdOrder.totalAmount;
    const customerGiven = finalAmount + 50000;

    const checkoutRes = await request('/payments/checkout', 'POST', {
      orderId: createdOrder.id,
      paymentMethod: 'CASH',
      customerGivenAmount: customerGiven,
      discountAmount: 0,
      notes: 'Khách thanh toán tiền mặt đủ',
    }, cashierToken);

    assert(checkoutRes.status === 200, 'Cashier completes checkout successfully');
    assert(checkoutRes.body.data.changeReturned === 50000, 'Cash change returned calculated accurately (50,000 VND)');
    assert(checkoutRes.body.data.invoice.invoiceNumber.startsWith('INV-'), 'Unique Invoice generated with INV- prefix');

    // Verify Table is now released back to AVAILABLE
    const tableReleased = await request('/tables');
    const tAvail = tableReleased.body.data.find((t: any) => t.id === targetTable.id);
    assert(tAvail.status === 'AVAILABLE', 'Table status is automatically released back to AVAILABLE');

    // Manager dashboard reflects updated revenue
    const dashboardAfter = await request('/manager/dashboard', 'GET', undefined, managerToken);
    assert(dashboardAfter.status === 200, 'Manager dashboard fetched successfully');
    assert(dashboardAfter.body.data.revenueToday >= finalAmount, 'Manager dashboard includes revenue from completed order');

    console.log('\n======================================================');
    console.log('✅ ALL TESTS PASSED! BACKEND & BUSINESS LOGIC 100% OPERATIONAL');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runTests();
