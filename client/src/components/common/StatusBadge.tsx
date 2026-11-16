import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const getStatusConfig = (st: string) => {
    switch (st) {
      // Table statuses
      case 'AVAILABLE':
        return { label: 'Bàn trống', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'OCCUPIED':
        return { label: 'Có khách', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'SERVING':
        return { label: 'Đang dùng bữa', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'PAYMENT_REQUESTED':
        return {
          label: 'Chờ thanh toán',
          bg: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold animate-pulse',
        };
      case 'RESERVED':
        return { label: 'Đã đặt trước', bg: 'bg-slate-100 text-slate-800 border-slate-300' };

      // Order & Item statuses
      case 'RECEIVED':
        return { label: 'Bếp đã nhận', bg: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'COOKING':
        return { label: 'Đang nấu', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'READY':
        return { label: 'Món đã sẵn sàng', bg: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'SERVED':
        return { label: 'Đã lên món', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'COMPLETED':
        return { label: 'Hoàn tất & Đã thanh toán', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'Đã hủy', bg: 'bg-rose-50 text-rose-800 border-rose-200' };

      // Roles
      case 'MANAGER':
        return { label: 'Quản lý', bg: 'bg-amber-50 text-amber-900 border-amber-200 font-medium' };
      case 'WAITER':
        return { label: 'Phục vụ', bg: 'bg-violet-50 text-violet-900 border-violet-200 font-medium' };
      case 'CHEF':
        return { label: 'Bếp trưởng', bg: 'bg-emerald-50 text-emerald-900 border-emerald-200 font-medium' };
      case 'CASHIER':
        return { label: 'Thu ngân', bg: 'bg-blue-50 text-blue-900 border-blue-200 font-medium' };
      case 'CUSTOMER':
        return { label: 'Khách hàng', bg: 'bg-stone-100 text-stone-800 border-stone-200' };

      default:
        return { label: st, bg: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  const config = getStatusConfig(status);

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border ${config.bg} ${sizeClass} tracking-wide transition-all ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
