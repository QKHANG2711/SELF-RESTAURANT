import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Order, Invoice } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ReceiptModal from '../../components/common/ReceiptModal';
import {
  Clock,
  Printer,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

export const CustomerOrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchCustomerOrders = async () => {
      try {
        setLoading(true);
        const data = await apiClient<{ items: Order[] }>('/orders');
        setOrders(data.items);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Lịch Sử Đơn Hàng Của Bạn
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Theo dõi tiến độ đơn đang phục vụ và xem lại các hóa đơn đã thanh toán trước đây
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-stone-200"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">Bạn chưa có đơn đặt món nào</h3>
          <p className="text-xs text-stone-500">Khám phá thực đơn và gọi món trực tiếp tại bàn ngay bây giờ.</p>
          <Link
            to="/menu"
            className="inline-block px-4 py-2 bg-[#234232] text-white text-xs font-semibold rounded-lg"
          >
            Xem Thực Đơn
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const hasInvoice = order.invoices && order.invoices.length > 0;
            const invoice = hasInvoice ? order.invoices![0] : null;

            return (
              <div
                key={order.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 hover:border-stone-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-base text-stone-900">
                      Bàn {order.table?.tableCode}
                    </span>
                    <span className="font-mono text-xs text-stone-500">
                      #{order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  <span className="text-xs text-stone-400">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                {/* Items preview */}
                <div className="space-y-1 text-xs">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-stone-700">
                      <span>
                        <strong className="text-stone-900">{item.quantity}x</strong>{' '}
                        {item.menuItem?.name}
                      </span>
                      <span>{item.subtotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-stone-400 block">Tổng tiền</span>
                    <span className="font-bold text-sm text-[#C25E2E]">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {invoice && (
                      <button
                        onClick={() => {
                          setSelectedInvoice({ ...invoice, order });
                          setShowReceiptModal(true);
                        }}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-lg transition flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Hóa Đơn</span>
                      </button>
                    )}

                    <Link
                      to={`/orders/${order.id}/track`}
                      className="px-3 py-1.5 bg-[#234232] hover:bg-[#182E23] text-white font-semibold text-xs rounded-lg transition flex items-center gap-1"
                    >
                      <span>Chi Tiết &amp; Tiến Độ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        invoice={selectedInvoice}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};

export default CustomerOrderHistoryPage;
