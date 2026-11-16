import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, AlertCircle, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName,
        email,
        phone,
        password,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đăng ký tài khoản');
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
            Tạo Tài Khoản Khách Hàng
          </h2>
          <p className="text-xs text-stone-500">
            Đăng ký để lưu lại lịch sử gọi món và nhận ưu đãi từ SELF RESTAURANT
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Họ và tên (*):</label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#2E5540]"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Email (*):</label>
            <input
              type="email"
              required
              placeholder="email@vidu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#2E5540]"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Số điện thoại liên hệ:</label>
            <input
              type="tel"
              placeholder="0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#2E5540]"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Mật khẩu (*):</label>
            <input
              type="password"
              required
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#2E5540]"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Xác nhận mật khẩu (*):</label>
            <input
              type="password"
              required
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#2E5540]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#234232] hover:bg-[#182E23] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Đang tạo tài khoản...' : 'ĐĂNG KÝ NGAY'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-[#2E5540] hover:underline">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
