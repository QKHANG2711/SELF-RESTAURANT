import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Menu as MenuIcon,
  X,
  LayoutDashboard,
  ChefHat,
  Receipt,
  Clock,
  QrCode,
  ClipboardList,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalCount, selectedTable } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-[#234232] text-[#FAF7EE] flex items-center justify-center shadow-sm group-hover:bg-[#182E23] transition">
              <UtensilsCrossed className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight block leading-tight">
                SELF RESTAURANT
              </span>
              <span className="text-[10px] tracking-widest text-[#2E5540] uppercase font-semibold">
                Ẩm Thực Tinh Hoa
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition ${
                isActive('/') ? 'text-[#234232] font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Trang Chủ
            </Link>
            <Link
              to="/menu"
              className={`text-sm font-medium transition ${
                isActive('/menu') ? 'text-[#234232] font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Thực Đơn
            </Link>

            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <Link
                to="/customer/orders"
                className={`text-sm font-medium flex items-center gap-1 transition ${
                  isActive('/customer/orders') ? 'text-[#234232] font-semibold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Clock className="w-4 h-4 text-stone-500" />
                <span>Đơn Của Tôi</span>
              </Link>
            )}

            {/* Role specific portals */}
            {isAuthenticated && (user?.role === 'WAITER' || user?.role === 'MANAGER') && (
              <Link
                to="/waiter"
                className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-900 font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-violet-300 transition"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Màn Hình Phục Vụ</span>
              </Link>
            )}

            {isAuthenticated && user?.role === 'MANAGER' && (
              <Link
                to="/manager"
                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-amber-300 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Trang Quản Lý</span>
              </Link>
            )}

            {isAuthenticated && user?.role === 'CHEF' && (
              <Link
                to="/chef"
                className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-emerald-300 transition"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Màn Hình Bếp</span>
              </Link>
            )}

            {isAuthenticated && user?.role === 'CASHIER' && (
              <Link
                to="/cashier"
                className="text-xs bg-sky-100 hover:bg-sky-200 text-sky-900 font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-sky-300 transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Quầy Thu Ngân</span>
              </Link>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Waiter shortcut if staff */}
            {isAuthenticated && (user?.role === 'WAITER' || user?.role === 'MANAGER') && (
              <Link
                to="/waiter"
                className="relative p-2 rounded-full hover:bg-stone-100 text-stone-700 transition"
                title="Màn hình phục vụ"
              >
                <ClipboardList className="w-5 h-5 text-violet-700" />
              </Link>
            )}

            {/* User Profile or Login */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 border-l border-stone-200 pl-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-stone-900 leading-tight">
                    {user.fullName}
                  </div>
                  <div className="mt-0.5">
                    <StatusBadge status={user.role} size="sm" />
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#234232] hover:text-[#182E23] px-3 py-2 rounded-md hover:bg-stone-100 transition"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-[#234232] hover:bg-[#182E23] text-white px-3.5 py-2 rounded-md shadow-sm transition"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && (user?.role === 'WAITER' || user?.role === 'MANAGER') && (
              <Link to="/waiter" className="p-2 text-violet-700" title="Màn hình phục vụ">
                <ClipboardList className="w-5 h-5" />
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 rounded-md hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Trang Chủ
          </Link>
          <Link
            to="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Thực Đơn
          </Link>

          {isAuthenticated && (user?.role === 'WAITER' || user?.role === 'MANAGER') && (
            <Link
              to="/waiter"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium bg-violet-50 text-violet-900 border border-violet-200 font-bold"
            >
              Vào Màn Hình Phục Vụ
            </Link>
          )}

          {isAuthenticated && user?.role === 'CUSTOMER' && (
            <Link
              to="/customer/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Lịch Sử Đơn Của Tôi
            </Link>
          )}

          {isAuthenticated && user?.role === 'MANAGER' && (
            <Link
              to="/manager"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium bg-amber-50 text-amber-900 border border-amber-200"
            >
              Vào Quản Trị Quản Lý
            </Link>
          )}

          {isAuthenticated && user?.role === 'CHEF' && (
            <Link
              to="/chef"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium bg-emerald-50 text-emerald-900 border border-emerald-200"
            >
              Vào Màn Hình Bếp
            </Link>
          )}

          {isAuthenticated && user?.role === 'CASHIER' && (
            <Link
              to="/cashier"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium bg-sky-50 text-sky-900 border border-sky-200"
            >
              Vào Quầy Thu Ngân
            </Link>
          )}

          <div className="pt-3 border-t border-stone-200">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 text-xs text-stone-500">
                  Đăng nhập: <strong>{user.fullName}</strong> ({user.role})
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 font-medium hover:bg-rose-50 rounded-md"
                >
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm border border-stone-300 rounded-md text-stone-800 font-medium"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm bg-[#234232] text-white rounded-md font-medium"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
