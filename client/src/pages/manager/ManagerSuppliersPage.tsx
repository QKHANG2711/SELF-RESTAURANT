import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  X,
  FileText,
  User,
} from 'lucide-react';
import apiClient from '../../api/client';
import { Supplier } from '../../types';

export const ManagerSuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await apiClient<Supplier[]>('/inventory/suppliers', {
        params: { search: search || undefined },
      });
      setSuppliers(res);
    } catch (err: any) {
      console.error('Lỗi tải nhà cung cấp:', err);
      setMessage({ type: 'error', text: err.message || 'Không thể tải nhà cung cấp' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contactName: sup.contactName || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      notes: sup.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingSupplier) {
        await apiClient(`/inventory/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          data: formData,
        });
        setMessage({ type: 'success', text: 'Cập nhật nhà cung cấp thành công!' });
      } else {
        await apiClient('/inventory/suppliers', {
          method: 'POST',
          data: formData,
        });
        setMessage({ type: 'success', text: 'Thêm nhà cung cấp mới thành công!' });
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Thao tác thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-700" />
            <span>Quản Lý Nhà Cung Cấp</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Danh bạ đối tác cung ứng nông sản, thực phẩm tươi sống, đồ uống và gia vị cho nhà hàng.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#234232] hover:bg-[#182E23] text-[#FAF7EE] text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhà Cung Cấp</span>
        </button>
      </div>

      {/* Message alert */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between shadow-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
          />
        </div>

        <button
          onClick={fetchSuppliers}
          className="p-2 border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-50 transition"
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="text-center py-12 text-stone-400 text-xs">Đang tải danh sách nhà cung cấp...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 text-stone-400 text-xs">Chưa có nhà cung cấp nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-3 relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                    {sup.supplierCode}
                  </span>
                  <h3 className="font-serif font-bold text-base text-stone-900 mt-1">{sup.name}</h3>
                </div>

                <button
                  onClick={() => handleOpenEdit(sup)}
                  className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-900 transition"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
                {sup.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Người liên hệ: <strong>{sup.contactName}</strong></span>
                  </div>
                )}
                {sup.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="font-mono">{sup.phone}</span>
                  </div>
                )}
                {sup.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] border-t border-stone-100 pt-3 text-stone-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>{sup._count?.stockReceipts || 0} phiếu nhập</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Đang hợp tác
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Thêm / Sửa Nhà Cung Cấp */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900">
                {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tên nhà cung cấp *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Công ty CP Thực Phẩm Xanh, HTX Rau Sạch..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Người liên hệ</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Anh Nam / Chị Lan..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@nhacungcap.vn"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Địa chỉ kho / cơ sở</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, đường, quận/huyện..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Chính sách thanh toán, lịch giao hàng..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingSupplier ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerSuppliersPage;
