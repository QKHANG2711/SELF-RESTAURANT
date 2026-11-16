import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, ArrowRight, ClipboardList, Info } from 'lucide-react';

export const TableOrderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If WAITER or MANAGER visits /order, automatically direct them to Waiter service screen
    if (user?.role === 'WAITER' || user?.role === 'MANAGER') {
      navigate('/waiter', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
        <Info className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Dịch Vụ Gọi Món Tại Bàn
        </h1>
        <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          Nhằm đảm bảo phục vụ chính xác và chu đáo nhất, <strong>nhân viên phục vụ (WAITER)</strong> của SELF RESTAURANT sẽ đến tận bàn để xác nhận vị trí ngồi và hỗ trợ quý khách gọi món.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm max-w-md mx-auto text-xs text-stone-700 space-y-3">
        <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px] text-[#2E5540]">
          Quy trình phục vụ tại nhà hàng
        </div>
        <p>1. Quý khách vui lòng chọn chỗ ngồi ưng ý tại nhà hàng.</p>
        <p>2. Nhân viên phục vụ sẽ đến bàn gửi thực đơn và ghi nhận các món quý khách yêu cầu.</p>
        <p>3. Quý khách có thể xem trước hình ảnh, giá bán và mô tả chi tiết các món trong thực đơn kỹ thuật số.</p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/menu"
          className="px-6 py-3 bg-[#234232] hover:bg-[#182E23] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
        >
          <UtensilsCrossed className="w-4 h-4 text-amber-200" />
          <span>Khám Phá Thực Đơn Nhà Hàng</span>
        </Link>

        {(user?.role === 'WAITER' || user?.role === 'MANAGER') && (
          <Link
            to="/waiter"
            className="px-6 py-3 bg-violet-800 hover:bg-violet-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Màn Hình Phục Vụ (Dành cho Nhân viên)</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default TableOrderPage;
