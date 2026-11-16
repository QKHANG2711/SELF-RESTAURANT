export type Role = 'CUSTOMER' | 'WAITER' | 'CHEF' | 'CASHIER' | 'MANAGER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  _count?: {
    menuItems: number;
  };
}

export interface MenuItem {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTimeMinutes: number;
  createdAt?: string;
}

export interface RestaurantArea {
  id: string;
  name: string;
  floor: number;
  description?: string;
  _count?: {
    tables: number;
  };
}

export interface RestaurantTable {
  id: string;
  tableCode: string;
  areaId: string;
  areaName?: string;
  floor?: number;
  area?: RestaurantArea;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'SERVING' | 'PAYMENT_REQUESTED' | 'RESERVED';
  qrCodeToken: string;
  activeOrder?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    itemCount: number;
    createdAt: string;
    paymentRequestedAt?: string;
  } | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  status: 'RECEIVED' | 'COOKING' | 'READY' | 'SERVED' | 'CANCELLED';
  startedCookingAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  table?: RestaurantTable;
  customerId?: string;
  customer?: User;
  waiterId?: string;
  waiter?: { id: string; fullName: string; email: string };
  status: 'RECEIVED' | 'COOKING' | 'READY' | 'SERVED' | 'PAYMENT_REQUESTED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  notes?: string;
  paymentRequestedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  payments?: Payment[];
  invoices?: Invoice[];
}

export interface Payment {
  id: string;
  orderId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'SIMULATED_QR';
  customerGivenAmount?: number;
  changeReturned?: number;
  status: string;
  transactionReference?: string;
  cashierId?: string;
  cashier?: User;
  paidAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  order?: Order;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  cashierId?: string;
  customerName?: string;
  tableCode: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  revenueToday: number;
  invoiceCountToday: number;
  averageOrderValue: number;
  activeOrdersCount: number;
  totalTables: number;
  occupiedTables: number;
  paymentRequestedTables: number;
  topSellingDishes: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  statusCounts: Array<{
    status: string;
    count: number;
  }>;
  lowStockAlerts?: Array<{
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    minimumStock: number;
    availableStock: number;
    status: 'LOW_STOCK' | 'OUT_OF_STOCK';
  }>;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    stockReceipts: number;
  };
}

export interface Ingredient {
  id: string;
  ingredientCode: string;
  name: string;
  unit: string;
  category?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  lastCostPrice?: number;
  isActive: boolean;
  stockStatus: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  notes?: string;
  createdAt: string;
}

export interface StockReceiptItem {
  id?: string;
  receiptId?: string;
  ingredientId: string;
  ingredient?: {
    name: string;
    unit: string;
  };
  quantity: number;
  unit: string;
  costPrice: number;
  subtotal: number;
  notes?: string;
}

export interface StockReceipt {
  id: string;
  receiptNumber: string;
  supplierId: string;
  supplier?: {
    id: string;
    name: string;
    supplierCode: string;
  };
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED';
  notes?: string;
  supplierInvoice?: string;
  receivedAt: string;
  confirmedAt?: string;
  createdAt: string;
  items?: StockReceiptItem[];
  _count?: {
    items: number;
  };
}

export interface RecipeIngredient {
  id?: string;
  recipeId?: string;
  ingredientId: string;
  ingredient?: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    reservedStock: number;
    minimumStock: number;
    availableStock?: number;
    stockStatus?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  };
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItem?: {
    id: string;
    name: string;
    isAvailable: boolean;
    price: number;
    categoryId?: string;
  };
  description?: string;
  isActive: boolean;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt?: string;
}

export interface StockTransaction {
  id: string;
  ingredientId: string;
  ingredient?: {
    name: string;
    unit: string;
  };
  type: 'IMPORT' | 'CONSUME' | 'RESERVE' | 'RELEASE' | 'ADJUST';
  quantity: number;
  unit: string;
  beforeStock: number;
  afterStock: number;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENT' | 'FIXED_AMOUNT';
  value: number;
  minimumOrder: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface RestaurantConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
}
