import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, ChefHat, Wallet, User as UserIcon, ClipboardList } from 'lucide-react';

export const DemoAccountBar: React.FC = () => {
  const { user, login } = useAuth();

  const handleQuickLogin = async (email: string) => {
    try {
      await login(email, 'Password123@');
    } catch (err: any) {
      alert('Đăng nhập thất bại: ' + err.message);
    }
  };

  return (
    <div className="bg-[#234232] text-[#F4F7F4] text-xs py-1.5 px-4 flex flex-wrap items-center justify-between border-b border-[#3D6B52]/30">
      <div className="flex items-center gap-2 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Môi trường Đồ án / Thử nghiệm:</span>
        <span className="text-[#E4EDE5] hidden sm:inline">Chuyển đổi tài khoản vai trò với 1 cú nhấp:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => handleQuickLogin('manager@selfrestaurant.vn')}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition ${
            user?.role === 'MANAGER'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-[#182E23] hover:bg-[#2E5540] text-[#FAF7EE]'
          }`}
          title="Tài khoản Quản lý với toàn quyền"
        >
          <Shield className="w-3.5 h-3.5 text-amber-300" />
          <span>Quản lý (MANAGER)</span>
        </button>

        <button
          onClick={() => handleQuickLogin('waiter@selfrestaurant.vn')}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition ${
            user?.role === 'WAITER'
              ? 'bg-violet-500 text-stone-950 font-bold'
              : 'bg-[#182E23] hover:bg-[#2E5540] text-[#FAF7EE]'
          }`}
          title="Tài khoản Nhân viên phục vụ chọn bàn và gọi món"
        >
          <ClipboardList className="w-3.5 h-3.5 text-violet-300" />
          <span>Phục vụ (WAITER)</span>
        </button>

        <button
          onClick={() => handleQuickLogin('chef@selfrestaurant.vn')}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition ${
            user?.role === 'CHEF'
              ? 'bg-emerald-500 text-stone-950 font-bold'
              : 'bg-[#182E23] hover:bg-[#2E5540] text-[#FAF7EE]'
          }`}
          title="Tài khoản Bếp trưởng điều phối món"
        >
          <ChefHat className="w-3.5 h-3.5 text-emerald-300" />
          <span>Bếp (CHEF)</span>
        </button>

        <button
          onClick={() => handleQuickLogin('cashier@selfrestaurant.vn')}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition ${
            user?.role === 'CASHIER'
              ? 'bg-sky-500 text-stone-950 font-bold'
              : 'bg-[#182E23] hover:bg-[#2E5540] text-[#FAF7EE]'
          }`}
          title="Tài khoản Thu ngân tính tiền và xuất hóa đơn"
        >
          <Wallet className="w-3.5 h-3.5 text-sky-300" />
          <span>Thu ngân (CASHIER)</span>
        </button>

        <button
          onClick={() => handleQuickLogin('customer@selfrestaurant.vn')}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition ${
            user?.role === 'CUSTOMER'
              ? 'bg-stone-300 text-stone-950 font-bold'
              : 'bg-[#182E23] hover:bg-[#2E5540] text-[#FAF7EE]'
          }`}
          title="Tài khoản Khách hàng gọi món"
        >
          <UserIcon className="w-3.5 h-3.5 text-stone-300" />
          <span>Khách (CUSTOMER)</span>
        </button>
      </div>
    </div>
  );
};

export default DemoAccountBar;
