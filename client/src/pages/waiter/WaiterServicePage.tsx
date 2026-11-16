import React, { useState, useEffect } from 'react';
import { RestaurantTable, MenuItem, Category, Order } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ClipboardList,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  RotateCw,
  UtensilsCrossed,
  AlertCircle,
  X,
  CreditCard,
  ChefHat,
  Check,
  User,
} from 'lucide-react';

interface SelectedDish {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export const WaiterServicePage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart for currently selected table
  const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([]);
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // Modal & feedback states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<{ title: string; subtitle: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);

  // Fetch all tables
  const fetchTables = async () => {
    try {
      const data = await apiClient<RestaurantTable[]>('/tables');
      setTables(data);

      if (selectedTable) {
        const refreshed = data.find((t) => t.id === selectedTable.id);
        if (refreshed) setSelectedTable(refreshed);
      }
    } catch (err: any) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoadingTables(false);
    }
  };

  // Fetch categories & menu items
  const fetchMenu = async () => {
    try {
      const [cats, items] = await Promise.all([
        apiClient<Category[]>('/menu/categories'),
        apiClient<MenuItem[]>('/menu/items', { params: { availableOnly: true } }),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (err: any) {
      console.error('Failed to fetch menu:', err);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchMenu();
    const interval = setInterval(fetchTables, 3000);
    return () => clearInterval(interval);
  }, []);

  // When a table is selected, load its active order (if any)
  const handleSelectTable = async (table: RestaurantTable) => {
    setSelectedTable(table);
    setSelectedDishes([]);
    setGeneralNotes('');
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      setLoadingOrder(true);
      const order = await apiClient<Order | null>(`/orders/table/${table.id}/active`);
      setActiveOrder(order);
    } catch (err: any) {
      console.error('Failed to fetch table active order:', err);
    } finally {
      setLoadingOrder(false);
    }
  };

  // Add dish to current selection
  const handleAddDish = (item: MenuItem) => {
    setSelectedDishes((prev) => {
      const existing = prev.find((d) => d.menuItem.id === item.id);
      if (existing) {
        return prev.map((d) =>
          d.menuItem.id === item.id ? { ...d, quantity: d.quantity + 1 } : d
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setSelectedDishes((prev) =>
      prev
        .map((d) => {
          if (d.menuItem.id === itemId) {
            const newQty = d.quantity + delta;
            return newQty > 0 ? { ...d, quantity: newQty } : null;
          }
          return d;
        })
        .filter(Boolean) as SelectedDish[]
    );
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    setSelectedDishes((prev) =>
      prev.map((d) => (d.menuItem.id === itemId ? { ...d, notes } : d))
    );
  };

  const handleRemoveDish = (itemId: string) => {
    setSelectedDishes((prev) => prev.filter((d) => d.menuItem.id !== itemId));
  };

  const totalCalculatedAmount = selectedDishes.reduce(
    (sum, d) => sum + d.menuItem.price * d.quantity,
    0
  );

  // Submit order or append items
  const handleConfirmSendOrder = async () => {
    if (!selectedTable || selectedDishes.length === 0) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        tableId: selectedTable.id,
        notes: generalNotes || undefined,
        items: selectedDishes.map((d) => ({
          menuItemId: d.menuItem.id,
          quantity: d.quantity,
          notes: d.notes || undefined,
        })),
      };

      const res = await apiClient<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Close confirm dialog
      setIsConfirmModalOpen(false);

      // Display official success notification as required
      setSuccessNotice({
        title: 'Đã gửi món thành công!',
        subtitle: `Đơn hàng bàn ${selectedTable.tableCode} đã được chuyển đến bếp.`,
      });

      // Clear temp selection
      setSelectedDishes([]);
      setGeneralNotes('');

      // Refresh active order and table status immediately
      setActiveOrder(res);
      await fetchTables();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi gửi đơn xuống bếp');
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark item served
  const handleMarkItemServed = async (itemId: string) => {
    try {
      await apiClient(`/orders/items/${itemId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'SERVED' }),
      });
      if (selectedTable) {
        const refreshedOrder = await apiClient<Order | null>(`/orders/table/${selectedTable.id}/active`);
        setActiveOrder(refreshedOrder);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Request payment for table
  const handleRequestPaymentForTable = async () => {
    if (!activeOrder) return;
    try {
      await apiClient(`/orders/${activeOrder.id}/request-payment`, { method: 'POST' });
      setSuccessNotice({
        title: 'Đã gửi yêu cầu thanh toán!',
        subtitle: `Thông báo đã chuyển đến Quầy Thu Ngân cho bàn ${selectedTable?.tableCode}.`,
      });
      if (selectedTable) {
        const refreshedOrder = await apiClient<Order | null>(`/orders/table/${selectedTable.id}/active`);
        setActiveOrder(refreshedOrder);
        await fetchTables();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-900 text-white flex items-center justify-center shadow-md">
            <ClipboardList className="w-6 h-6 text-violet-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                Màn Hình Phục Vụ (WAITER)
              </h1>
              <span className="bg-violet-100 text-violet-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Nhân viên phục vụ gọi món
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Chọn bàn ăn thực tế, ghi nhận món ăn theo yêu cầu của khách và điều phối gửi xuống bếp
            </p>
          </div>
        </div>

        <button
          onClick={fetchTables}
          className="p-2 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold"
          title="Làm mới sơ đồ bàn"
        >
          <RotateCw className="w-4 h-4" />
          <span>Làm Mới Sơ Đồ</span>
        </button>
      </div>

      {/* Prominent Success Notification Notice */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-start justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-950">{successNotice.title}</h4>
              <p className="text-emerald-800 mt-0.5">{successNotice.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="p-1 text-emerald-600 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 text-rose-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* =========================================================================
            KHU VỰC A: SƠ ĐỒ BÀN (4 Cols)
           ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-stone-900 uppercase tracking-wider">
              A. Sơ Đồ Bàn Phục Vụ
            </h2>
            <span className="text-xs text-stone-500 font-semibold">{tables.length} bàn</span>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-3 text-[11px] text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Trống
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Có khách
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Chờ tính tiền
            </span>
          </div>

          {loadingTables ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-stone-200"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {tables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const isPaymentWaiting = table.status === 'PAYMENT_REQUESTED';
                const isOccupied = ['OCCUPIED', 'SERVING'].includes(table.status);

                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 relative ${
                      isSelected
                        ? 'border-violet-600 ring-2 ring-violet-600 bg-white shadow-md'
                        : isPaymentWaiting
                        ? 'border-amber-400 bg-amber-50/70'
                        : isOccupied
                        ? 'border-blue-200 bg-blue-50/40 hover:border-blue-300'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-lg text-stone-900">
                          {table.tableCode}
                        </span>
                        <StatusBadge status={table.status} size="sm" />
                      </div>
                      <span className="text-[10px] text-stone-500 block mt-0.5">
                        {table.areaName} • {table.capacity} chỗ
                      </span>
                    </div>

                    {table.activeOrder ? (
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">{table.activeOrder.itemCount} món</span>
                        <span className="font-bold text-[#C25E2E]">
                          {table.activeOrder.totalAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 font-semibold italic">
                        Bàn sẵn sàng
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            KHU VỰC B & C: TẠO ĐƠN & THEO DÕI ĐƠN CỦA BÀN ĐƯỢC CHỌN (8 Cols)
           ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedTable ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-stone-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center mx-auto">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Vui lòng chọn một bàn ăn bên trái
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Nhấp vào bàn bất kỳ để bắt đầu gọi món, thêm món hoặc theo dõi tiến độ phục vụ của bàn đó.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Table Overview Header */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      Bàn {selectedTable.tableCode} ({selectedTable.areaName})
                    </h2>
                    <StatusBadge status={selectedTable.status} size="sm" />
                  </div>
                  <span className="text-xs text-stone-500 block mt-0.5">
                    Sức chứa: {selectedTable.capacity} người • {activeOrder ? `Đang có đơn #${activeOrder.orderNumber}` : 'Bàn trống chưa có đơn'}
                  </span>
                </div>

                {activeOrder && (
                  <div className="flex items-center gap-2">
                    {activeOrder.status !== 'PAYMENT_REQUESTED' && (
                      <button
                        onClick={handleRequestPaymentForTable}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Báo Thu Ngân Tính Tiền</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* =========================================================================
                  KHU VỰC C: THEO DÕI CÁC MÓN ĐÃ GỌI CỦA BÀN NÀY (NẾU ĐÃ CÓ ĐƠN)
                 ========================================================================= */}
              {activeOrder && (
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-700" />
                      <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                        C. Các Món Đang Phục Vụ ({activeOrder.items.length} món)
                      </h3>
                    </div>
                    {activeOrder.waiter && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>Phục vụ: <strong>{activeOrder.waiter.fullName}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
                    {activeOrder.items.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{item.quantity}x</span>
                            <span className="font-semibold text-stone-800">{item.menuItem?.name}</span>
                            <StatusBadge status={item.status} size="sm" />
                          </div>
                          {item.notes && (
                            <span className="text-[11px] text-stone-500 italic block mt-0.5 ml-6">
                              Ghi chú: {item.notes}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-stone-900">
                            {item.subtotal.toLocaleString('vi-VN')} đ
                          </span>
                          {item.status === 'READY' && (
                            <button
                              onClick={() => handleMarkItemServed(item.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                              title="Bấm khi đã mang ra bàn"
                            >
                              <Check className="w-3 h-3" />
                              <span>Lên bàn</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex justify-between items-baseline text-xs">
                    <span className="text-stone-500">Tổng tiền hiện tại của bàn:</span>
                    <span className="text-sm font-bold text-[#C25E2E]">
                      {activeOrder.totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  KHU VỰC B: CHỌN MÓN ĐỂ GỬI ĐƠN MỚI HOẶC GỌI THÊM MÓN
                 ========================================================================= */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">
                      B. {activeOrder ? 'Gọi Thêm Món Vào Bàn Này' : 'Tạo Đơn Gọi Món Mới Cho Bàn'}
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Chọn món từ danh mục bên dưới, chỉnh số lượng và ghi chú trước khi gửi xuống bếp.
                    </p>
                  </div>
                </div>

                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Tìm món nhanh..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-600"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        selectedCategory === 'all'
                          ? 'bg-violet-900 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      Tất cả
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                          selectedCategory === c.id
                            ? 'bg-violet-900 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dish selection list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                  {filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddDish(item)}
                      className="p-3 rounded-xl border border-stone-200 hover:border-violet-400 bg-white hover:bg-violet-50/20 cursor-pointer transition flex flex-col justify-between space-y-2 group"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 group-hover:text-violet-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-[11px] font-bold text-[#C25E2E]">
                          {item.price.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-full py-1 bg-stone-100 group-hover:bg-violet-900 group-hover:text-white rounded-lg text-[10px] font-bold text-stone-700 transition flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm món</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Currently Selected Dishes to Send */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                      Món Mới Chuẩn Bị Gửi Xuống Bếp ({selectedDishes.length})
                    </span>
                    {selectedDishes.length > 0 && (
                      <button
                        onClick={() => setSelectedDishes([])}
                        className="text-[11px] text-rose-600 font-semibold hover:underline"
                      >
                        Xóa chọn
                      </button>
                    )}
                  </div>

                  {selectedDishes.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-3 text-center">
                      Chưa chọn món nào. Nhấp vào các món ăn ở trên để thêm vào danh sách gửi bếp.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDishes.map((dish) => (
                        <div
                          key={dish.menuItem.id}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">{dish.menuItem.name}</span>
                            <span className="font-bold text-[#C25E2E]">
                              {(dish.menuItem.price * dish.quantity).toLocaleString('vi-VN')} đ
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              placeholder="Ghi chú (Ví dụ: không hành, ít cay, không đá)..."
                              value={dish.notes}
                              onChange={(e) => handleUpdateNotes(dish.menuItem.id, e.target.value)}
                              className="flex-1 px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-[11px] focus:ring-1 focus:ring-violet-600"
                            />

                            <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shrink-0">
                              <button
                                onClick={() => handleUpdateQuantity(dish.menuItem.id, -1)}
                                className="p-1 hover:bg-stone-100 text-stone-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 font-bold text-xs text-stone-900">
                                {dish.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(dish.menuItem.id, 1)}
                                className="p-1 hover:bg-stone-100 text-stone-600"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveDish(dish.menuItem.id)}
                              className="p-1 text-stone-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* General order notes */}
                      <div className="pt-2">
                        <input
                          type="text"
                          placeholder="Ghi chú chung cho toàn bộ đơn (Tùy chọn)..."
                          value={generalNotes}
                          onChange={(e) => setGeneralNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-600"
                        />
                      </div>

                      {/* Subtotal & Action buttons */}
                      <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] text-stone-400 block">Cộng tiền món mới:</span>
                          <span className="font-bold text-base text-[#C25E2E]">
                            {totalCalculatedAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsConfirmModalOpen(true)}
                            disabled={selectedDishes.length === 0 || isSubmitting}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 text-white ${
                              selectedDishes.length === 0 || isSubmitting
                                ? 'bg-stone-300 cursor-not-allowed'
                                : 'bg-[#234232] hover:bg-[#182E23]'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5 text-amber-200" />
                            <span>GỬI ĐƠN XUỐNG BẾP</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal before Sending */}
      {isConfirmModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-violet-700" />
                <span>Xác Nhận Gửi Đơn Xuống Bếp</span>
              </h3>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-violet-50 rounded-xl text-violet-900 space-y-1">
                <div>Bàn phục vụ: <strong>Bàn {selectedTable.tableCode}</strong> ({selectedTable.areaName})</div>
                <div>Loại thao tác: <strong>{activeOrder ? 'Bổ sung món vào đơn hiện có' : 'Tạo đơn gọi món mới'}</strong></div>
              </div>

              <div className="font-bold text-stone-700">Danh sách các món sẽ gửi bếp:</div>
              <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
                {selectedDishes.map((dish) => (
                  <div key={dish.menuItem.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold mr-2 text-stone-900">{dish.quantity}x</span>
                      <span>{dish.menuItem.name}</span>
                      {dish.notes && (
                        <span className="text-[10px] text-stone-400 block italic">({dish.notes})</span>
                      )}
                    </div>
                    <span className="font-bold text-stone-800">
                      {(dish.menuItem.price * dish.quantity).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-between font-bold text-sm">
                <span>Tổng tiền:</span>
                <span className="text-[#C25E2E]">{totalCalculatedAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={handleConfirmSendOrder}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#234232] hover:bg-[#182E23] text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Đang gửi...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Xác Nhận Gửi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterServicePage;
