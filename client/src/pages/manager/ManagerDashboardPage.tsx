import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Banknote,
  Receipt,
  ShoppingBag,
  Layers,
  TrendingUp,
  Award,
  AlertCircle,
  RotateCw,
  AlertTriangle,
  Package,
  Plus,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const ManagerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    try {
      const data = await apiClient<DashboardStats>('/manager/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-stone-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Báo Cáo Tổng Quan Nhà Hàng
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Dữ liệu tổng hợp theo thời gian thực từ cơ sở dữ liệu nhà hàng
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-sm"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Cập nhật số liệu</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Today */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Doanh Thu Hôm Nay</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#C25E2E]">
            {stats.revenueToday.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Từ {stats.invoiceCountToday} lượt hóa đơn đã xuất</span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Đơn Đang Phục Vụ / Chế Biến</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {stats.activeOrdersCount} đơn
          </div>
          <div className="text-[11px] text-stone-500">
            Bếp và bàn ăn đang xử lý đồng bộ
          </div>
        </div>

        {/* Occupied Tables */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Bàn Đang Có Khách</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {stats.occupiedTables} / {stats.totalTables}
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{stats.paymentRequestedTables} bàn đang yêu cầu tính tiền</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Giá Trị Đơn Trung Bình (AOV)</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {stats.averageOrderValue.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-stone-500">
            Bình quân mỗi lượt khách dùng bữa
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      {stats.lowStockAlerts && stats.lowStockAlerts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-stone-950 rounded-xl font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Cảnh Báo Tồn Kho: Có {stats.lowStockAlerts.length} nguyên liệu sắp hết hoặc đã hết
                </h3>
                <p className="text-[11px] text-amber-900/80 mt-0.5">
                  Các món ăn sử dụng các nguyên liệu này có thể bị ảnh hưởng khả năng phục vụ khách hàng.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/manager/inventory/receipts"
                className="px-3 py-1.5 bg-[#234232] hover:bg-[#182E23] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lập Phiếu Nhập Kho</span>
              </Link>
              <Link
                to="/manager/inventory/ingredients"
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold rounded-xl border border-amber-300 transition flex items-center gap-1"
              >
                <span>Xem Chi Tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            {stats.lowStockAlerts.map((ing) => (
              <div
                key={ing.id}
                className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-stone-900 truncate max-w-[140px]">{ing.name}</div>
                  <div className="text-[11px] text-stone-500">
                    Tồn: <strong className={ing.currentStock <= 0 ? 'text-rose-600' : 'text-amber-700'}>{ing.currentStock}</strong> / Tối thiểu {ing.minimumStock} {ing.unit}
                  </div>
                </div>

                {ing.status === 'OUT_OF_STOCK' ? (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>Hết</span>
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Sắp hết</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-900">Biểu Đồ Doanh Thu 7 Ngày Gần Nhất</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">Xu hướng doanh thu bán hàng thực tế qua các ngày</p>
          </div>
          <div className="text-xs font-semibold text-[#2E5540] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Đơn vị: VNĐ
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.revenueChart} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                tickFormatter={(value) => `${(value / 1000).toLocaleString('vi-VN')}k`}
              />
              <Tooltip
                formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
              />
              <Bar dataKey="revenue" fill="#2E5540" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two columns: Top Selling Dishes & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Selling Dishes (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-stone-900">Món Bán Chạy Nhất (Theo Số Lượng)</h3>
          </div>

          {stats.topSellingDishes.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">Chưa có dữ liệu đơn hàng đã hoàn tất.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {stats.topSellingDishes.map((dish, idx) => (
                <div key={dish.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 font-bold text-xs text-stone-700 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=100'}
                      alt={dish.name}
                      className="w-10 h-10 object-cover rounded-lg border border-stone-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{dish.name}</h4>
                      <span className="text-[11px] text-[#C25E2E] font-semibold">
                        {dish.price.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-stone-900">{dish.totalQuantity} đĩa</div>
                    <div className="text-[11px] text-stone-500">
                      Tổng: {dish.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-stone-900">Phân Phối Trạng Thái Đơn Hàng</h3>

          <div className="space-y-3">
            {stats.statusCounts.map((s) => (
              <div key={s.status} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-xs">
                <StatusBadge status={s.status} size="sm" />
                <span className="font-bold text-stone-900">{s.count} đơn</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;
