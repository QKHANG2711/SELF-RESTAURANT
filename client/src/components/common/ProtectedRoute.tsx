import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]">
        <div className="w-8 h-8 border-4 border-[#234232] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-stone-200 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
          !
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-900">Truy Cập Bị Từ Chối (403)</h2>
        <p className="text-xs text-stone-500">
          Tài khoản của bạn ({user.role}) không có quyền truy cập vào khu vực này. Cần quyền:{' '}
          <strong>{allowedRoles.join(', ')}</strong>.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition"
          >
            Quay lại trang trước
          </button>
          <a
            href="/"
            className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white text-xs font-semibold rounded-xl transition"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
