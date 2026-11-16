import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Search,
  Filter,
  Eye,
  XCircle,
  Clock,
  RotateCw,
  X,
  AlertCircle,
  Receipt,
} from 'lucide-react';

export const ManagerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Cancel order modal
  const [cancelingOrder, setCancelingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiClient<{ items: Order[] }>('/orders', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 50,
        },
      });
      setOrders(data.items);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleConfirmCancel = async () => {
    if (!cancelingOrder) return;
    try {
      await apiClient(`/orders/${cancelingOrder.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelReason: cancelReason || 'Quản lý hủy đơn theo yêu cầu',
        }),
      });

      setCancelingOrder(null);
      setCancelReason('');
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.table?.tableCode.toLowerCase().includes(q) ||
      o.customer?.fullName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Quản Lý Toàn Bộ Đơn Hàng
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Giám sát trạng thái đơn hàng, theo dõi tiến độ bếp và xử lý sự cố hủy đơn
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 transition shadow-sm flex items-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'RECEIVED', label: 'Bếp nhận' },
            { id: 'COOKING', label: 'Đang nấu' },
            { id: 'READY', label: 'Đã nấu xong' },
            { id: 'PAYMENT_REQUESTED', label: 'Chờ thanh toán' },
            { id: 'COMPLETED', label: 'Đã hoàn tất' },
            { id: 'CANCELLED', label: 'Đã hủy' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st.id
                  ? 'bg-[#234232] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm mã đơn, mã bàn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2E5540]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 divide-y divide-stone-100">
            <thead className="bg-stone-50 font-bold uppercase text-[10px] text-stone-500">
              <tr>
                <th className="py-3 px-4">Mã Đơn</th>
                <th className="py-3 px-4">Bàn</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Số Lượng Món</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Tổng Tiền</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50/50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-stone-900">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    {ord.table?.tableCode}
                  </td>
                  <td className="py-3 px-4">{ord.customer?.fullName || 'Khách Tại Bàn'}</td>
                  <td className="py-3 px-4 text-stone-500">
                    {new Date(ord.createdAt).toLocaleTimeString('vi-VN')}{' '}
                    <span className="text-[10px] text-stone-400">
                      ({new Date(ord.createdAt).toLocaleDateString('vi-VN')})
                    </span>
                  </td>
                  <td className="py-3 px-4">{ord.items.length} món</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ord.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#C25E2E]">
                    {ord.totalAmount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                        title="Xem chi tiết đơn"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' && (
                        <button
                          onClick={() => setCancelingOrder(ord)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Hủy đơn"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Chi Tiết Đơn Hàng #{selectedOrder.orderNumber}
                </h3>
                <span className="text-[11px] text-stone-500">
                  Bàn {selectedOrder.table?.tableCode} • {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <div className="divide-y divide-stone-100 text-xs">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 mr-2">{it.quantity}x</span>
                      <span>{it.menuItem?.name}</span>
                      {it.notes && (
                        <span className="text-[11px] text-stone-400 block italic">
                          Ghi chú: {it.notes}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-stone-900">
                        {it.subtotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline text-xs">
              <span className="font-bold text-stone-800">Tổng Tiền:</span>
              <span className="font-bold text-base text-[#C25E2E]">
                {selectedOrder.totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl hover:bg-stone-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Dialog */}
      {cancelingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-sm text-stone-900 text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Xác Nhận Hủy Đơn Hàng</span>
            </h3>

            <p className="text-xs text-stone-600">
              Bạn có chắc chắn muốn hủy đơn <strong>#{cancelingOrder.orderNumber}</strong> của bàn{' '}
              <strong>{cancelingOrder.table?.tableCode}</strong>? Bàn sẽ tự động được giải phóng.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Lý do hủy đơn:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Khách đổi ý, sự cố bàn..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
              <button
                onClick={() => setCancelingOrder(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
              >
                Không hủy
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
              >
                Xác Nhận Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerOrdersPage;
