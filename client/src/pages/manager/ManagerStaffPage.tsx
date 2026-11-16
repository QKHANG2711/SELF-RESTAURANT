import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Users,
  UserPlus,
  Lock,
  Unlock,
  KeyRound,
  Edit2,
  Check,
  AlertCircle,
  X,
  Shield,
} from 'lucide-react';

export const ManagerStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create Staff Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Password123@',
    role: 'CHEF' as Role,
  });

  // Edit / Reset password modal
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await apiClient<User[]>('/manager/staff');
      setStaffList(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await apiClient('/manager/staff', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast(`Đã tạo tài khoản nhân viên ${form.fullName} (${form.role})`);
      setIsCreateOpen(false);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        password: 'Password123@',
        role: 'CHEF',
      });
      fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleToggleLock = async (staff: User) => {
    const action = staff.isActive ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản của ${staff.fullName}?`)) return;

    try {
      await apiClient(`/manager/staff/${staff.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !staff.isActive }),
      });
      showToast(`Đã ${action} tài khoản thành công`);
      fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      await apiClient(`/manager/staff/${editingStaff.id}`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      });
      showToast(`Đã đặt lại mật khẩu cho ${editingStaff.fullName}`);
      setEditingStaff(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#234232] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Quản Lý Nhân Viên &amp; Phân Quyền
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Tạo tài khoản nhân viên Bếp (CHEF), Thu ngân (CASHIER), Quản lý (MANAGER) và quản trị quyền hạn
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tạo Tài Khoản Nhân Viên</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 divide-y divide-stone-100">
            <thead className="bg-stone-50 font-bold uppercase text-[10px] text-stone-500">
              <tr>
                <th className="py-3 px-4">Họ Và Tên</th>
                <th className="py-3 px-4">Email Đăng Nhập</th>
                <th className="py-3 px-4">Số Điện Thoại</th>
                <th className="py-3 px-4">Vai Trò Hệ Thống</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {staffList.map((st) => (
                <tr key={st.id} className="hover:bg-stone-50/50 transition">
                  <td className="py-3 px-4 font-bold text-stone-900">{st.fullName}</td>
                  <td className="py-3 px-4 font-mono">{st.email}</td>
                  <td className="py-3 px-4 text-stone-500">{st.phone || 'Chưa cập nhật'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={st.role} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        st.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {st.isActive ? 'Đang hoạt động' : 'Đã bị khóa'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingStaff(st);
                          setNewPassword('');
                        }}
                        className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-stone-100 rounded-lg transition"
                        title="Đổi mật khẩu"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleLock(st)}
                        className={`p-1.5 rounded-lg transition ${
                          st.isActive
                            ? 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-rose-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={st.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {st.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900">Tạo Tài Khoản Nhân Viên Mới</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Họ và tên (*):</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Email đăng nhập (*):</label>
                <input
                  type="email"
                  required
                  placeholder="nhanvien@selfrestaurant.vn"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    placeholder="090..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Vai trò hệ thống (*):</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                  >
                    <option value="CHEF">Bếp (CHEF)</option>
                    <option value="CASHIER">Thu ngân (CASHIER)</option>
                    <option value="MANAGER">Quản lý (MANAGER)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mật khẩu khởi tạo (*):</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white rounded-xl font-bold shadow-sm"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-sm text-stone-900">
              Đặt Lại Mật Khẩu Cho: {editingStaff.fullName}
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Mật khẩu mới (*):</label>
                <input
                  type="password"
                  required
                  placeholder="Ít nhất 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
                >
                  Xác Nhận Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerStaffPage;
