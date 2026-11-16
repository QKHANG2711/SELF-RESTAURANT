import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UtensilsCrossed,
  Shield,
  ChefHat,
  Wallet,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123@');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const user = await login(email, password);

      // Role-based smart redirection
      if (user.role === 'MANAGER') {
        navigate('/manager');
      } else if (user.role === 'WAITER') {
        navigate('/waiter');
      } else if (user.role === 'CHEF') {
        navigate('/chef');
      } else if (user.role === 'CASHIER') {
        navigate('/cashier');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-stone-200 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#234232] text-amber-300 flex items-center justify-center mx-auto shadow-md">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Đăng Nhập Hệ Thống
          </h2>
          <p className="text-xs text-stone-500">
            SELF RESTAURANT - Nền tảng quản lý ẩm thực chuyên nghiệp
          </p>
        </div>

        {/* Quick fill demo credentials */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
          <span className="text-[11px] font-bold text-stone-700 block uppercase tracking-wider">
            Tài Khoản Thử Nghiệm Nhanh (1 Nhấp Chuột):
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('manager@selfrestaurant.vn')}
              className="p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-left flex items-center gap-2 hover:shadow-sm transition"
            >
              <Shield className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <strong className="block text-stone-900 text-[11px]">Quản Lý</strong>
                <span className="text-[10px] text-stone-400">Toàn quyền</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('waiter@selfrestaurant.vn')}
              className="p-2 rounded-xl bg-white border border-stone-200 hover:border-violet-400 text-left flex items-center gap-2 hover:shadow-sm transition"
            >
              <ClipboardList className="w-4 h-4 text-violet-600 shrink-0" />
              <div>
                <strong className="block text-stone-900 text-[11px]">Phục Vụ</strong>
                <span className="text-[10px] text-stone-400">Chọn bàn &amp; món</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('chef@selfrestaurant.vn')}
              className="p-2 rounded-xl bg-white border border-stone-200 hover:border-emerald-400 text-left flex items-center gap-2 hover:shadow-sm transition"
            >
              <ChefHat className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-stone-900 text-[11px]">Bếp Trưởng</strong>
                <span className="text-[10px] text-stone-400">Màn hình KDS</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('cashier@selfrestaurant.vn')}
              className="p-2 rounded-xl bg-white border border-stone-200 hover:border-sky-400 text-left flex items-center gap-2 hover:shadow-sm transition"
            >
              <Wallet className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <strong className="block text-stone-900 text-[11px]">Thu Ngân</strong>
                <span className="text-[10px] text-stone-400">Tính tiền &amp; HĐ</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('customer@selfrestaurant.vn')}
              className="p-2 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-left flex items-center gap-2 hover:shadow-sm transition"
            >
              <UserIcon className="w-4 h-4 text-stone-600 shrink-0" />
              <div>
                <strong className="block text-stone-900 text-[11px]">Khách Hàng</strong>
                <span className="text-[10px] text-stone-400">Gọi món tại bàn</span>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Email đăng nhập:</label>
            <input
              type="email"
              required
              placeholder="ten@selfrestaurant.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E5540]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-stone-700">Mật khẩu:</label>
              <span className="text-[10px] text-stone-400">Mặc định: Password123@</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E5540]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#234232] hover:bg-[#182E23] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP HỆ THỐNG'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Chưa có tài khoản khách hàng?{' '}
          <Link to="/register" className="font-bold text-[#2E5540] hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
