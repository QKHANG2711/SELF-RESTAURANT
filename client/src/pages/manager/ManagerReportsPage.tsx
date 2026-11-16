import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Invoice } from '../../types';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  CreditCard,
  Banknote,
  QrCode,
  RotateCw,
} from 'lucide-react';

interface ReportData {
  totalGross: number;
  totalDiscount: number;
  totalNetRevenue: number;
  totalInvoices: number;
  paymentMethodsBreakdown: Record<string, { count: number; total: number }>;
  invoices: Invoice[];
}

export const ManagerReportsPage: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [method, setMethod] = useState<string>('all');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await apiClient<ReportData>('/manager/revenue-report', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          paymentMethod: method !== 'all' ? method : undefined,
        },
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load revenue report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, method]);

  const handleExportCSV = () => {
    if (!data || data.invoices.length === 0) {
      alert('Không có dữ liệu hóa đơn để xuất file.');
      return;
    }

    const headers = ['Số HĐ', 'Bàn', 'Khách hàng', 'Thời gian', 'Phương thức', 'Tổng tiền', 'Giảm giá', 'Thực thu'];
    const rows = data.invoices.map((inv) => [
      inv.invoiceNumber,
      inv.tableCode,
      `"${inv.customerName || 'Khách vãng lai'}"`,
      new Date(inv.createdAt).toLocaleString('vi-VN'),
      inv.paymentMethod,
      inv.totalAmount,
      inv.discountAmount,
      inv.finalAmount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_SelfRestaurant_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Báo Cáo Doanh Thu &amp; Đối Soát
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Thống kê doanh số bán hàng, phân tích phương thức thanh toán và xuất file báo cáo
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-stone-400" />
          <span className="font-bold text-stone-700">Từ ngày:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-[#2E5540]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-700">Đến ngày:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-[#2E5540]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <span className="font-bold text-stone-700">Hình thức:</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-[#2E5540]"
          >
            <option value="all">Tất cả hình thức</option>
            <option value="CASH">Tiền mặt (CASH)</option>
            <option value="BANK_TRANSFER">Chuyển khoản (BANK_TRANSFER)</option>
            <option value="CARD">Thẻ ngân hàng (CARD)</option>
          </select>
        </div>

        <button
          onClick={fetchReport}
          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition ml-auto"
          title="Làm mới"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="h-64 bg-white rounded-2xl border border-stone-200 animate-pulse"></div>
      ) : data ? (
        <div className="space-y-6">
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs text-stone-500">Tổng Doanh Thu Thực Nhận</span>
              <div className="text-2xl font-bold text-[#C25E2E]">
                {data.totalNetRevenue.toLocaleString('vi-VN')} đ
              </div>
              <span className="text-[11px] text-stone-400">Doanh thu đã trừ giảm giá</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs text-stone-500">Tổng Số Hóa Đơn Đã Thu</span>
              <div className="text-2xl font-bold text-stone-900">
                {data.totalInvoices} hóa đơn
              </div>
              <span className="text-[11px] text-stone-400">Thanh toán hoàn tất</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs text-stone-500">Tổng Tiền Giảm Giá Khuyến Mãi</span>
              <div className="text-2xl font-bold text-rose-600">
                {data.totalDiscount.toLocaleString('vi-VN')} đ
              </div>
              <span className="text-[11px] text-stone-400">Chiết khấu cho khách</span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-stone-900">Cơ Cấu Phương Thức Thanh Toán</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(data.paymentMethodsBreakdown).map(([mth, val]) => (
                <div key={mth} className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900">{mth}</span>
                    <span className="text-[11px] text-stone-500 block">{val.count} giao dịch</span>
                  </div>
                  <span className="font-bold text-sm text-[#2E5540]">
                    {val.total.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices Detailed Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 font-bold text-xs text-stone-900">
              Chi Tiết Danh Sách Hóa Đơn ({data.invoices.length})
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700 divide-y divide-stone-100">
                <thead className="bg-stone-50 font-bold uppercase text-[10px] text-stone-500">
                  <tr>
                    <th className="py-3 px-4">Số HĐ</th>
                    <th className="py-3 px-4">Bàn</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Ngày Xuất</th>
                    <th className="py-3 px-4">Hình Thức</th>
                    <th className="py-3 px-4 text-right">Giảm Giá</th>
                    <th className="py-3 px-4 text-right">Thực Thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-bold">{inv.tableCode}</td>
                      <td className="py-3 px-4">{inv.customerName || 'Khách vãng lai'}</td>
                      <td className="py-3 px-4 text-stone-500">
                        {new Date(inv.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-stone-100 rounded text-[11px] font-medium">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        {inv.discountAmount > 0 ? `-${inv.discountAmount.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#C25E2E]">
                        {inv.finalAmount.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManagerReportsPage;
