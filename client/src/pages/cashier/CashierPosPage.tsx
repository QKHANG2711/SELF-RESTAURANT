import React, { useState, useEffect } from 'react';
import { RestaurantTable, Order, Invoice } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ReceiptModal from '../../components/common/ReceiptModal';
import {
  Wallet,
  Receipt,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  ChevronRight,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const CashierPosPage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);

  // Checkout form state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD'>('CASH');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customerGivenAmount, setCustomerGivenAmount] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Promotion voucher code state
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState<boolean>(false);

  const handleApplyPromo = async () => {
    if (!promoCode || !activeOrder) return;
    try {
      setApplyingPromo(true);
      setPromoMessage(null);
      const res = await apiClient<any>('/inventory/promotions/validate', {
        params: {
          code: promoCode.trim().toUpperCase(),
          orderTotal: activeOrder.totalAmount,
        },
      });
      setDiscountAmount(res.discountAmount);
      setCustomerGivenAmount(res.finalAmount);
      setPromoMessage({
        type: 'success',
        text: `Áp dụng mã "${res.promo.code}" thành công! Giảm ${res.discountAmount.toLocaleString('vi-VN')} đ`,
      });
    } catch (err: any) {
      setPromoMessage({
        type: 'error',
        text: err.message || 'Mã khuyến mãi không hợp lệ',
      });
    } finally {
      setApplyingPromo(false);
    }
  };

  // Success Receipt Modal state
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Tab: 'MAP' or 'INVOICES'
  const [activeTab, setActiveTab] = useState<'MAP' | 'INVOICES'>('MAP');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');

  const fetchTables = async () => {
    try {
      const data = await apiClient<RestaurantTable[]>('/tables');
      setTables(data);

      // If a table is currently selected, refresh its details
      if (selectedTable) {
        const refreshed = data.find((t) => t.id === selectedTable.id);
        if (refreshed) {
          setSelectedTable(refreshed);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await apiClient<{ items: Invoice[] }>('/payments/invoices', {
        params: { search: invoiceSearch || undefined, limit: 30 },
      });
      setInvoices(data.items);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'INVOICES') {
      fetchInvoices();
    }
  }, [activeTab, invoiceSearch]);

  const handleSelectTable = async (table: RestaurantTable) => {
    setSelectedTable(table);
    setErrorMessage(null);
    setDiscountAmount(0);

    try {
      setLoadingOrder(true);
      const order = await apiClient<Order | null>(`/orders/table/${table.id}/active`);
      setActiveOrder(order);

      if (order) {
        setCustomerGivenAmount(order.totalAmount);
      }
    } catch (err: any) {
      setErrorMessage('Lỗi khi tải đơn hàng bàn: ' + err.message);
    } finally {
      setLoadingOrder(false);
    }
  };

  const finalAmount = activeOrder ? Math.max(0, activeOrder.totalAmount - discountAmount) : 0;
  const changeReturned = paymentMethod === 'CASH' ? Math.max(0, customerGivenAmount - finalAmount) : 0;

  const handleConfirmCheckout = async () => {
    if (!activeOrder) return;
    setErrorMessage(null);

    if (paymentMethod === 'CASH' && customerGivenAmount < finalAmount) {
      setErrorMessage(`Tiền khách đưa (${customerGivenAmount.toLocaleString('vi-VN')} đ) không đủ để thanh toán tổng tiền (${finalAmount.toLocaleString('vi-VN')} đ)`);
      return;
    }

    try {
      setIsProcessing(true);
      const res = await apiClient<{ invoice: Invoice; changeReturned: number }>('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({
          orderId: activeOrder.id,
          paymentMethod,
          customerGivenAmount: paymentMethod === 'CASH' ? customerGivenAmount : finalAmount,
          discountAmount,
          notes: checkoutNotes,
        }),
      });

      // Show completed invoice in modal
      setLastInvoice({
        ...res.invoice,
        order: activeOrder,
      });
      setShowReceiptModal(true);

      // Reset active order & refresh tables
      setActiveOrder(null);
      await fetchTables();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi xác nhận thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-900 text-white flex items-center justify-center shadow-md">
            <Receipt className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Quầy Thu Ngân &amp; Quản Lý Hóa Đơn
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Theo dõi bàn ăn, tiếp nhận yêu cầu thanh toán và in hóa đơn bán hàng
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'MAP'
                ? 'bg-[#234232] text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Sơ Đồ Bàn Phục Vụ
          </button>
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'INVOICES'
                ? 'bg-[#234232] text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Lịch Sử Hóa Đơn
          </button>
          <button
            onClick={fetchTables}
            className="p-2 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'MAP' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Table Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-stone-900 uppercase tracking-wider">
                Danh Sách Bàn Ăn
              </h2>
              <div className="flex items-center gap-3 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Trống
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Có khách
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> Chờ thanh toán
                </span>
              </div>
            </div>

            {loadingTables ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-stone-200"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tables.map((table) => {
                  const isSelected = selectedTable?.id === table.id;
                  const isPaymentWaiting = table.status === 'PAYMENT_REQUESTED';
                  const isOccupied = ['OCCUPIED', 'SERVING'].includes(table.status);

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleSelectTable(table)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 relative ${
                        isSelected
                          ? 'border-[#234232] ring-2 ring-[#234232] bg-white shadow-md'
                          : isPaymentWaiting
                          ? 'border-amber-400 bg-amber-50/70 shadow-sm animate-pulse'
                          : isOccupied
                          ? 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
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
                        <span className="text-[11px] text-stone-500 block mt-0.5">
                          {table.areaName} • {table.capacity} chỗ
                        </span>
                      </div>

                      {table.activeOrder ? (
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                          <span className="text-stone-500">{table.activeOrder.itemCount} món</span>
                          <span className="font-bold text-[#C25E2E]">
                            {table.activeOrder.totalAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-stone-400 italic">Bàn trống</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Checkout & Billing Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5 sticky top-24">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#2E5540]" />
                  <h3 className="font-bold text-sm text-stone-900">
                    {selectedTable ? `Thanh Toán Bàn ${selectedTable.tableCode}` : 'Chi Tiết Đơn Bàn'}
                  </h3>
                </div>
                {selectedTable && <StatusBadge status={selectedTable.status} size="sm" />}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!selectedTable ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-stone-500">
                    Vui lòng nhấp chọn một bàn ăn bên trái để xem đơn và thanh toán.
                  </p>
                </div>
              ) : loadingOrder ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-[#234232] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-stone-500">Đang tải chi tiết đơn hàng...</p>
                </div>
              ) : !activeOrder ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-xs text-stone-500">
                    Bàn <strong>{selectedTable.tableCode}</strong> hiện không có đơn hàng đang hoạt động.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Order Items Breakdown */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <div className="flex justify-between text-[11px] text-stone-400 font-semibold uppercase">
                      <span>Món</span>
                      <span>Thành tiền</span>
                    </div>

                    {activeOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs py-1 border-b border-stone-50">
                        <div>
                          <span className="font-bold text-stone-900 mr-1.5">{item.quantity}x</span>
                          <span className="text-stone-800">{item.menuItem?.name}</span>
                        </div>
                        <span className="font-semibold text-stone-800">
                          {item.subtotal.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="bg-stone-50 p-4 rounded-xl space-y-2 text-xs border border-stone-100">
                    <div className="flex justify-between text-stone-600">
                      <span>Tiền món:</span>
                      <span className="font-bold text-stone-900">
                        {activeOrder.totalAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    {/* Voucher Promotion Input */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Nhập mã voucher (GIAM10...)"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 px-2.5 py-1 text-xs uppercase font-mono font-bold bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E5540]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={applyingPromo || !promoCode}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 transition"
                        >
                          {applyingPromo ? '...' : 'Áp dụng'}
                        </button>
                      </div>

                      {promoMessage && (
                        <div
                          className={`text-[11px] font-medium p-1.5 rounded-lg ${
                            promoMessage.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {promoMessage.text}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-600">Giảm giá / Voucher:</span>
                      <div className="flex items-center gap-1 w-32">
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-right px-2 py-1 bg-white border border-stone-300 rounded text-xs focus:ring-1 focus:ring-[#2E5540] font-mono font-bold text-emerald-700"
                        />
                        <span className="text-stone-500">đ</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-stone-200">
                      <span>KHÁCH CẦN TRẢ:</span>
                      <span className="text-base text-[#C25E2E]">
                        {finalAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-700">
                      Phương Thức Thanh Toán:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'CASH'
                            ? 'bg-[#234232] text-white border-[#234232]'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Tiền Mặt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('BANK_TRANSFER')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'BANK_TRANSFER'
                            ? 'bg-[#234232] text-white border-[#234232]'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Chuyển Khoản</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'CARD'
                            ? 'bg-[#234232] text-white border-[#234232]'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Thẻ POS</span>
                      </button>
                    </div>
                  </div>

                  {/* Cash Change Calculation */}
                  {paymentMethod === 'CASH' && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-700">Tiền khách đưa:</span>
                        <div className="flex items-center gap-1 w-36">
                          <input
                            type="number"
                            min={finalAmount}
                            step="10000"
                            value={customerGivenAmount}
                            onChange={(e) =>
                              setCustomerGivenAmount(Math.max(0, parseInt(e.target.value) || 0))
                            }
                            className="w-full text-right px-2 py-1 bg-white border border-stone-300 rounded text-xs font-bold focus:ring-1 focus:ring-[#2E5540]"
                          />
                          <span className="text-stone-500">đ</span>
                        </div>
                      </div>

                      {/* Quick cash denomination helper buttons */}
                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setCustomerGivenAmount(finalAmount)}
                          className="px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-[10px] font-semibold"
                        >
                          Vừa đủ
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerGivenAmount(Math.ceil(finalAmount / 100000) * 100000)}
                          className="px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-[10px] font-semibold"
                        >
                          Tròn 100k
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerGivenAmount(Math.ceil(finalAmount / 500000) * 500000 || 500000)}
                          className="px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-[10px] font-semibold"
                        >
                          500k
                        </button>
                      </div>

                      <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 font-bold">
                        <span className="text-stone-700">Tiền thừa thối lại:</span>
                        <span className="text-sm text-emerald-700">
                          {changeReturned.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Confirm Checkout Button */}
                  <button
                    onClick={handleConfirmCheckout}
                    disabled={isProcessing}
                    className="w-full py-3.5 bg-[#234232] hover:bg-[#182E23] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>
                      {isProcessing
                        ? 'Đang xử lý xuất hóa đơn...'
                        : 'XÁC NHẬN THANH TOÁN & GIẢI PHÓNG BÀN'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Tab Invoices History */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-bold text-sm text-stone-900">Danh Sách Hóa Đơn Đã Xuất</h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm mã hóa đơn, bàn, tên khách..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2E5540]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 divide-y divide-stone-100">
              <thead className="bg-stone-50 font-bold uppercase text-[10px] text-stone-500">
                <tr>
                  <th className="py-3 px-4">Số Hóa Đơn</th>
                  <th className="py-3 px-4">Bàn</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Hình Thức</th>
                  <th className="py-3 px-4 text-right">Tổng Tiền</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">{inv.tableCode}</td>
                    <td className="py-3 px-4">{inv.customerName || 'Khách vãng lai'}</td>
                    <td className="py-3 px-4 text-stone-500">
                      {new Date(inv.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-stone-100 rounded text-[11px] font-medium">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#C25E2E]">
                      {inv.finalAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setLastInvoice(inv);
                          setShowReceiptModal(true);
                        }}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Xem / In</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        invoice={lastInvoice}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};

export default CashierPosPage;
