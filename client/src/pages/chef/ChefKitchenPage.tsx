import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Flame,
  AlertTriangle,
  RotateCw,
  Utensils,
  Check,
} from 'lucide-react';

export const ChefKitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE'); // ACTIVE, RECEIVED, COOKING, READY, ALL
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchKitchenOrders = async () => {
    try {
      const data = await apiClient<{ items: Order[] }>('/orders', {
        params: { limit: 50 },
      });
      setOrders(data.items);
    } catch (err) {
      console.error('Failed to fetch kitchen orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingId(orderId);
      await apiClient(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await fetchKitchenOrders();
    } catch (err: any) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: string) => {
    try {
      await apiClient(`/orders/items/${itemId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await fetchKitchenOrders();
    } catch (err: any) {
      alert('Lỗi cập nhật món: ' + err.message);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'ACTIVE') {
      return ['RECEIVED', 'COOKING', 'READY'].includes(order.status);
    }
    if (filterStatus === 'ALL') return true;
    return order.status === filterStatus;
  });

  const getElapsedTimeMinutes = (createdAt: string) => {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(elapsedMs / (1000 * 60));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
            <ChefHat className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                Màn Hình Điều Phối Bếp (KDS)
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                Thời gian thực
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Tiếp nhận phiếu gọi món từ khách, điều phối chế biến và báo hoàn thành món ăn
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'ACTIVE'
                ? 'bg-[#234232] text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Đang Xử Lý ({orders.filter((o) => ['RECEIVED', 'COOKING', 'READY'].includes(o.status)).length})
          </button>

          <button
            onClick={() => setFilterStatus('RECEIVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'RECEIVED'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Chờ Bếp Nhận
          </button>

          <button
            onClick={() => setFilterStatus('COOKING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'COOKING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Đang Nấu
          </button>

          <button
            onClick={() => setFilterStatus('READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'READY'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Đã Xong Món
          </button>

          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'ALL'
                ? 'bg-stone-800 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Tất Cả Lịch Sử
          </button>

          <button
            onClick={fetchKitchenOrders}
            className="p-1.5 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-50 transition"
            title="Làm mới dữ liệu"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kitchen Ticket Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-stone-200"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">Hiện không có phiếu gọi món nào cần xử lý</h3>
          <p className="text-xs text-stone-500">Màn hình sẽ tự động cập nhật ngay khi có khách gửi đơn mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const waitMinutes = getElapsedTimeMinutes(order.createdAt);
            const isUrgent = waitMinutes > 20;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden transition ${
                  isUrgent
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : order.status === 'RECEIVED'
                    ? 'border-sky-300'
                    : order.status === 'COOKING'
                    ? 'border-amber-300'
                    : 'border-stone-200'
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isUrgent
                      ? 'bg-rose-50 border-rose-200'
                      : order.status === 'RECEIVED'
                      ? 'bg-sky-50 border-sky-100'
                      : order.status === 'COOKING'
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-stone-50 border-stone-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-stone-900">
                        Bàn {order.table?.tableCode}
                      </span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Mã: {order.orderNumber}
                    </span>
                  </div>

                  {/* Wait Time Indicator */}
                  <div
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                      isUrgent
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{waitMinutes} phút</span>
                  </div>
                </div>

                {/* General order notes */}
                {order.notes && (
                  <div className="mx-4 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <strong>Ghi chú đơn:</strong> {order.notes}
                  </div>
                )}

                {/* Items Checklist */}
                <div className="p-4 flex-1 divide-y divide-stone-100 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="pt-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                            {item.quantity}
                          </span>
                          <span className="text-xs font-bold text-stone-900">
                            {item.menuItem?.name}
                          </span>
                        </div>
                        {item.notes && (
                          <span className="text-[11px] text-rose-600 font-semibold block mt-0.5 ml-7">
                            ★ {item.notes}
                          </span>
                        )}
                      </div>

                      {/* Item state toggle for chef */}
                      <button
                        onClick={() =>
                          handleUpdateItemStatus(
                            item.id,
                            item.status === 'READY' ? 'COOKING' : 'READY'
                          )
                        }
                        className={`text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1 transition ${
                          item.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                        title="Bấm để đánh dấu hoàn thành món"
                      >
                        {item.status === 'READY' && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>{item.status === 'READY' ? 'Xong' : 'Chưa xong'}</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Ticket Footer Action Buttons */}
                <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center gap-2">
                  {order.status === 'RECEIVED' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'COOKING')}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Nhận Đơn &amp; Chế Biến</span>
                    </button>
                  )}

                  {order.status === 'COOKING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Báo Toàn Bộ Món Đã Xong</span>
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'SERVED')}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Đã Lên Món Cho Khách</span>
                    </button>
                  )}

                  {['SERVED', 'PAYMENT_REQUESTED', 'COMPLETED'].includes(order.status) && (
                    <div className="w-full text-center py-1.5 text-xs text-stone-500 font-medium">
                      Đã phục vụ xong - Chờ khách dùng bữa &amp; thanh toán
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChefKitchenPage;
