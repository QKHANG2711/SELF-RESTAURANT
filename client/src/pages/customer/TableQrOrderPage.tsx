import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  QrCode,
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Bell,
  Receipt,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import apiClient from '../../api/client';
import { MenuItem, Category, RestaurantTable } from '../../types';

export const TableQrOrderPage: React.FC = () => {
  const { token, tableCode } = useParams<{ token?: string; tableCode?: string }>();
  const qrToken = token || tableCode || '';

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  // Cart
  const [cart, setCart] = useState<
    Array<{ menuItem: MenuItem; quantity: number; notes: string }>
  >([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Call waiter modal
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [callReason, setCallReason] = useState<string>('Xin thêm nước / đá');
  const [callSuccessMsg, setCallSuccessMsg] = useState<string | null>(null);

  // Request payment
  const [requestingPayment, setRequestingPayment] = useState<boolean>(false);

  const fetchTableAndMenu = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch table by QR token
      const tableData = await apiClient<RestaurantTable>(`/tables/qr/${qrToken}`);
      setTable(tableData);

      // Fetch menu
      const [cats, items] = await Promise.all([
        apiClient<Category[]>('/menu/categories'),
        apiClient<MenuItem[]>('/menu/items', { params: { availableOnly: true } }),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (err: any) {
      console.error('Lỗi khi tải mã QR bàn:', err);
      setError(err.message || 'Mã QR bàn không hợp lệ hoặc không tìm thấy bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (qrToken) {
      fetchTableAndMenu();
    }
  }, [qrToken]);

  // Cart actions
  const handleAddToCart = (item: MenuItem) => {
    const existingIndex = cart.findIndex((c) => c.menuItem.id === item.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { menuItem: item, quantity: 1, notes: '' }]);
    }
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      updated[index].quantity = newQty;
      setCart(updated);
    }
  };

  const handleUpdateItemNotes = (index: number, notes: string) => {
    const updated = [...cart];
    updated[index].notes = notes;
    setCart(updated);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit QR Order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    try {
      setSubmittingOrder(true);
      const res = await apiClient<any>('/orders/qr-order', {
        method: 'POST',
        data: {
          qrToken,
          notes: orderNotes || undefined,
          items: cart.map((c) => ({
            menuItemId: c.menuItem.id,
            quantity: c.quantity,
            notes: c.notes || undefined,
          })),
        },
      });

      setOrderSuccessMsg(
        'Đã gửi món thành công! Đơn hàng đã được chuyển đến bếp để chế biến.'
      );
      setCart([]);
      setOrderNotes('');
      fetchTableAndMenu();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi đơn hàng');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Call waiter
  const handleCallWaiter = async () => {
    try {
      await apiClient('/orders/qr-call-waiter', {
        method: 'POST',
        data: { qrToken, reason: callReason },
      });
      setShowCallModal(false);
      setCallSuccessMsg(`Đã gọi phục vụ ("${callReason}"). Nhân viên sẽ đến hỗ trợ bàn ngay!`);
      setTimeout(() => setCallSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gọi nhân viên');
    }
  };

  // Request payment
  const handleRequestPayment = async () => {
    if (!table?.activeOrder) return;
    try {
      setRequestingPayment(true);
      await apiClient(`/orders/${table.activeOrder.id}/request-payment`, {
        method: 'POST',
      });
      alert('Đã gửi yêu cầu thanh toán tới thu ngân! Vui lòng chuẩn bị thanh toán.');
      fetchTableAndMenu();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi yêu cầu thanh toán');
    } finally {
      setRequestingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#234232] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-stone-600 font-medium">Đang nhận diện bàn từ mã QR...</p>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
          <X className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-900">Không Thể Nhận Diện Bàn</h2>
        <p className="text-xs text-stone-600">{error || 'Mã QR bàn không hợp lệ hoặc đã hết hạn.'}</p>
        <Link
          to="/"
          className="px-4 py-2 bg-[#234232] text-white text-xs font-semibold rounded-xl shadow-sm"
        >
          Về Trang Chủ
        </Link>
      </div>
    );
  }

  const filteredItems = menuItems.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'all' || item.categoryId === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-[#FAF9F5] pb-28 text-stone-900">
      {/* Table Header Banner */}
      <div className="sticky top-0 z-30 bg-[#234232] text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold font-serif text-sm">
            {table.tableCode}
          </div>
          <div>
            <div className="font-serif font-bold text-sm text-[#FAF7EE] flex items-center gap-1.5">
              <span>Bàn {table.tableCode}</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-normal">
                {table.area?.name || 'Tầng 1'}
              </span>
            </div>
            <div className="text-[10px] text-amber-300 font-medium">
              SELF RESTAURANT • Gọi Món Trực Tuyến
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCallModal(true)}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Gọi Phục Vụ</span>
        </button>
      </div>

      {/* Notifications */}
      {orderSuccessMsg && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-start gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Gửi món thành công!</strong>
            <p className="mt-0.5 text-[11px] text-emerald-800">{orderSuccessMsg}</p>
          </div>
          <button onClick={() => setOrderSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {callSuccessMsg && (
        <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center justify-between shadow-sm">
          <span>{callSuccessMsg}</span>
          <button onClick={() => setCallSuccessMsg(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Order Banner if table is occupied */}
      {table.activeOrder && (
        <div className="m-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                Đơn hiện tại tại bàn
              </span>
              <div className="font-serif font-bold text-sm text-stone-900">
                {table.activeOrder.orderNumber}
              </div>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              {table.activeOrder.status === 'PAYMENT_REQUESTED'
                ? 'Đang Chờ Tính Tiền'
                : 'Đang Phục Vụ / Chế Biến'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs border-t border-stone-100 pt-2">
            <span className="text-stone-500">Tạm tính ({table.activeOrder.itemCount} món):</span>
            <span className="font-bold text-[#C25E2E] text-sm">
              {table.activeOrder.totalAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            {table.activeOrder.status !== 'PAYMENT_REQUESTED' && (
              <button
                onClick={handleRequestPayment}
                disabled={requestingPayment}
                className="flex-1 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Yêu Cầu Thanh Toán</span>
              </button>
            )}
            <Link
              to={`/orders/${table.activeOrder.id}/track`}
              className="px-3 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-xs rounded-xl transition text-center"
            >
              Xem Chi Tiết Món
            </Link>
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm món ăn yêu thích..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedCat === 'all'
                ? 'bg-[#234232] text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedCat === c.id
                  ? 'bg-[#234232] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Dishes List */}
      <div className="px-4 space-y-3">
        <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          {table.activeOrder ? 'Gọi thêm món vào bàn' : 'Thực đơn chọn món'}
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
            Không tìm thấy món ăn phù hợp.
          </div>
        ) : (
          filteredItems.map((dish) => {
            const inCart = cart.find((c) => c.menuItem.id === dish.id);

            return (
              <div
                key={dish.id}
                className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3"
              >
                <img
                  src={dish.imageUrl || 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=200'}
                  alt={dish.name}
                  className="w-20 h-20 rounded-xl object-cover border border-stone-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-sm text-stone-900 truncate">{dish.name}</h4>
                  <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{dish.description}</p>
                  <div className="font-bold text-xs text-[#C25E2E] mt-1">
                    {dish.price.toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div className="shrink-0">
                  {inCart ? (
                    <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                      <button
                        onClick={() => handleUpdateQuantity(cart.indexOf(inCart), -1)}
                        className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-200 shadow-xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-xs px-1.5">{inCart.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(cart.indexOf(inCart), 1)}
                        className="w-6 h-6 bg-[#234232] text-white rounded-lg flex items-center justify-center hover:bg-[#182E23] shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(dish)}
                      className="px-3 py-1.5 bg-[#234232] hover:bg-[#182E23] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Cart Drawer / Bottom Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-2xl p-4 max-w-lg mx-auto rounded-t-3xl space-y-3">
          <div className="max-h-40 overflow-y-auto divide-y divide-stone-100 pr-1">
            {cart.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs">
                <div className="flex-1 truncate">
                  <div className="font-bold text-stone-900 truncate">{item.menuItem.name}</div>
                  <input
                    type="text"
                    placeholder="Ghi chú: ít cay, không hành..."
                    value={item.notes}
                    onChange={(e) => handleUpdateItemNotes(idx, e.target.value)}
                    className="w-full text-[11px] text-stone-600 placeholder-stone-400 focus:outline-none pt-0.5"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-stone-600 font-semibold">
                    {(item.menuItem.price * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(idx, -1)}
                      className="p-1 hover:bg-stone-100 rounded text-stone-500"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(idx, 1)}
                      className="p-1 hover:bg-stone-100 rounded text-stone-500"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-100 pt-2 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-stone-500">
                Tổng cộng ({totalCount} phần món):
              </div>
              <div className="font-serif font-bold text-lg text-[#C25E2E]">
                {totalAmount.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={submittingOrder}
              className="px-6 py-3 bg-[#234232] hover:bg-[#182E23] text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{submittingOrder ? 'Đang gửi...' : 'Gửi Đơn Cho Bếp'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Gọi phục vụ */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Gọi Nhân Viên Phục Vụ</span>
              </h3>
              <button onClick={() => setShowCallModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-stone-700">Nhu cầu cần hỗ trợ:</label>
              {[
                'Xin thêm nước lọc / đá',
                'Xin thêm muỗng đũa / chén đĩa',
                'Tư vấn món ăn',
                'Hỗ trợ khác...',
              ].map((r) => (
                <button
                  key={r}
                  onClick={() => setCallReason(r)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition ${
                    callReason === r
                      ? 'border-[#234232] bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowCallModal(false)}
                className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleCallWaiter}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-xs text-xs"
              >
                Gửi Yêu Cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableQrOrderPage;
