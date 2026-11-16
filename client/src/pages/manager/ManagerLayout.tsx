import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  ShoppingBag,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Eye,
  Package,
  Truck,
  FileText,
  BookOpen,
  Tag,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export const ManagerLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/manager', label: 'Tổng Quan', icon: LayoutDashboard },
    { path: '/manager/menu', label: 'Quản Lý Món & Danh Mục', icon: UtensilsCrossed },
    { path: '/manager/tables', label: 'Quản Lý Bàn & Khu Vực', icon: Layers },
    { path: '/manager/orders', label: 'Quản Lý Đơn Hàng', icon: ShoppingBag },
    { label: '— Kho nguyên liệu —', divider: true },
    { path: '/manager/inventory/ingredients', label: 'Nguyên Liệu', icon: Package },
    { path: '/manager/inventory/suppliers', label: 'Nhà Cung Cấp', icon: Truck },
    { path: '/manager/inventory/receipts', label: 'Phiếu Nhập Kho', icon: FileText },
    { path: '/manager/inventory/recipes', label: 'Công Thức Món Ăn', icon: BookOpen },
    { path: '/manager/promotions', label: 'Khuyến Mãi', icon: Tag },
    { label: '— Quản trị —', divider: true },
    { path: '/manager/reports', label: 'Báo Cáo Doanh Thu', icon: BarChart3 },
    { path: '/manager/staff', label: 'Quản Lý Nhân Viên', icon: Users },
    { path: '/manager/audit', label: 'Nhật Ký Hoạt Động', icon: ShieldAlert },
    { path: '/manager/settings', label: 'Cấu Hình Nhà Hàng', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex">
      {/* Sidebar */}
      <aside
        className={`bg-[#182E23] text-stone-100 border-r border-[#234232] transition-all duration-300 flex flex-col justify-between z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#234232]">
            <Link to="/" className="flex items-center gap-2 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm shrink-0">
                SR
              </div>
              {!collapsed && (
                <div className="truncate">
                  <span className="font-serif font-bold text-sm text-[#FAF7EE] block leading-tight">
                    SELF RESTAURANT
                  </span>
                  <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">
                    Cổng Quản Trị
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-[#234232] transition"
              title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto">
            {navItems.map((item, idx) => {
              if ((item as any).divider) {
                return !collapsed ? (
                  <div key={idx} className="pt-2 pb-1">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider px-3">{item.label}</span>
                  </div>
                ) : <div key={idx} className="my-1 border-t border-[#234232]" />;
              }
              const Icon = item.icon!;
              const isActive = location.pathname === item.path || (item.path !== '/manager' && location.pathname.startsWith(item.path!));

              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                      : 'text-stone-300 hover:bg-[#234232] hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-[#234232] space-y-2">
          {!collapsed && (
            <div className="px-3 py-2 bg-[#111317]/40 rounded-xl space-y-1">
              <div className="text-xs font-bold text-stone-200 truncate">{user?.fullName}</div>
              <div className="flex items-center justify-between">
                <StatusBadge status="MANAGER" size="sm" />
                <span className="text-[10px] text-stone-400">Toàn quyền</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs text-stone-300 hover:bg-[#234232] transition"
              title="Về Website Khách hàng"
            >
              <Eye className="w-4 h-4" />
              {!collapsed && <span>Xem Website</span>}
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/50 transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>Quản trị</span>
            <span>/</span>
            <span className="font-semibold text-stone-900">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Bảng điều khiển'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600 hidden sm:inline">
              Hệ thống quản lý nhà hàng <strong>SELF RESTAURANT</strong> v1.0
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
