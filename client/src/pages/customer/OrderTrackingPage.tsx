import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ReceiptModal from '../../components/common/ReceiptModal';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  UtensilsCrossed,
  Receipt,
  AlertCircle,
  CreditCard,
  Printer,
  ArrowLeft,
  Check,
} from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [requestingPayment, setRequestingPayment] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const data = await apiClient<Order>(`/orders/${id}`);
      setOrder(data);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err.message || 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto-poll order status every 3 seconds
    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const handleRequestPayment = async () => {
    if (!order) return;
    try {
      setRequestingPayment(true);
      setErrorMessage(null);

      const updated = await apiClient<Order>(`/orders/${order.id}/request-payment`, {
        method: 'POST',
      });

      setOrder(updated);
      setActionMessage('Đã gửi yêu cầu thanh toán thành công! Nhân viên thu ngân đang chuẩn bị hóa đơn cho bàn của bạn.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi gửi yêu cầu thanh toán');
    } finally {
      setRequestingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#234232] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-stone-500">Đang đồng bộ dữ liệu tiến độ đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    const isForbidden = fetchError?.includes('quyền') || fetchError?.includes('403');

    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-stone-200 shadow-xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-stone-900">
          {isForbidden ? 'Không Có Quyền Xem Đơn Hàng' : 'Không Tìm Thấy Đơn Hàng'}
        </h2>
        <p className="text-xs text-stone-500">
          {isForbidden
            ? 'Đơn hàng này thuộc về bàn hoặc khách hàng khác. Quý khách không có quyền truy cập.'
            : 'Mã đơn hàng không tồn tại hoặc đã hoàn tất và lưu trữ.'}
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            to="/"
            className="px-4 py-2 bg-[#234232] text-white text-xs font-semibold rounded-xl"
          >
            Về Trang Chủ
          </Link>
          <Link
            to="/menu"
            className="px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold rounded-xl"
          >
            Xem Thực Đơn
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'RECEIVED', label: 'Bếp Tiếp Nhận', desc: 'Đơn hàng đã gửi tới hệ thống bếp' },
    { key: 'COOKING', label: 'Đang Chế Biến', desc: 'Đầu bếp đang thực hiện các món ăn' },
    { key: 'READY', label: 'Món Đã Xong', desc: 'Món ăn hoàn tất, sẵn sàng phục vụ' },
    { key: 'SERVED', label: 'Đang Phục Vụ', desc: 'Món ăn đã được mang lên bàn' },
    { key: 'PAYMENT_REQUESTED', label: 'Chờ Thanh Toán', desc: 'Thu ngân đang xử lý hóa đơn' },
    { key: 'COMPLETED', label: 'Đã Hoàn Tất', desc: 'Bàn đã thanh toán hoàn thành' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 0;
      case 'COOKING':
        return 1;
      case 'READY':
        return 2;
      case 'SERVED':
        return 3;
      case 'PAYMENT_REQUESTED':
        return 4;
      case 'COMPLETED':
        return 5;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isCompleted = order.status === 'COMPLETED';
  const isPaymentRequested = order.status === 'PAYMENT_REQUESTED';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link to="/order" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Link>
        <div className="text-right">
          <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Mã đơn hàng</span>
          <span className="font-mono font-bold text-xs text-stone-900">{order.orderNumber}</span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Bàn {order.table?.tableCode}
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Thời gian gọi món: {new Date(order.createdAt).toLocaleTimeString('vi-VN')} ({order.table?.area?.name || 'Sảnh'})
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-stone-400 block uppercase">Tổng tiền thanh toán</span>
            <span className="text-lg font-bold text-[#C25E2E]">
              {order.totalAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        {/* Progress Timeline */}
        {!isCancelled && (
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">
              Tiến Độ Chế Biến &amp; Phục Vụ Trực Tiếp
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="relative flex items-start gap-3">
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition ${
                        isCurrent
                          ? 'bg-[#2E5540] border-[#2E5540] text-white shadow-sm ring-4 ring-emerald-100'
                          : isPassed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-stone-300 text-stone-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3" /> : idx + 1}
                    </span>

                    <div>
                      <h4
                        className={`text-xs font-bold leading-tight ${
                          isCurrent ? 'text-[#2E5540]' : isPassed ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items Detail */}
        <div className="space-y-3 pt-4 border-t border-stone-100">
          <h3 className="font-bold text-xs text-stone-900">Chi Tiết Món Ăn Trong Đơn:</h3>
          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-900 mr-2">{item.quantity}x</span>
                  <span className="text-stone-800">{item.menuItem?.name}</span>
                  {item.notes && (
                    <span className="text-[11px] text-stone-500 block italic">
                      Ghi chú: {item.notes}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} size="sm" />
                  <span className="font-semibold text-stone-900">
                    {item.subtotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-stone-100 space-y-3">
          {!isCompleted && !isCancelled && (
            <button
              onClick={handleRequestPayment}
              disabled={requestingPayment || isPaymentRequested}
              className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                isPaymentRequested
                  ? 'bg-amber-500 text-stone-950 cursor-default'
                  : 'bg-[#C25E2E] hover:bg-[#A34B22] text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isPaymentRequested
                  ? 'ĐÃ GỬI YÊU CẦU THANH TOÁN - THU NGÂN ĐANG TỚI'
                  : 'YÊU CẦU THANH TOÁN HÓA ĐƠN'}
              </span>
            </button>
          )}

          {isCompleted && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Đơn hàng đã được thanh toán hoàn tất. Cảm ơn Quý Khách!</span>
              </div>
              {order.invoices && order.invoices.length > 0 && (
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="px-3 py-1.5 bg-[#234232] text-white text-xs font-semibold rounded-lg hover:bg-[#182E23] transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xem / In Hóa Đơn</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice receipt modal */}
      {order.invoices && order.invoices.length > 0 && (
        <ReceiptModal
          invoice={{
            ...order.invoices[0],
            order: order,
          }}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

export default OrderTrackingPage;
