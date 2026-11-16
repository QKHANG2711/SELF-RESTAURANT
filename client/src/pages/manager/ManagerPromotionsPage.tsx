import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Percent,
} from 'lucide-react';
import apiClient from '../../api/client';
import { Promotion } from '../../types';

export const ManagerPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENT' as 'PERCENT' | 'FIXED_AMOUNT',
    value: 10,
    minimumOrder: 100000,
    maximumDiscount: 50000,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    usageLimit: 100,
    isActive: true,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await apiClient<Promotion[]>('/inventory/promotions');
      setPromotions(res);
    } catch (err: any) {
      console.error('Lỗi tải khuyến mãi:', err);
      setMessage({ type: 'error', text: err.message || 'Không thể tải khuyến mãi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENT',
      value: 10,
      minimumOrder: 100000,
      maximumDiscount: 50000,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      usageLimit: 100,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p: Promotion) => {
    setEditingPromo(p);
    setFormData({
      code: p.code,
      name: p.name,
      description: p.description || '',
      type: p.type,
      value: p.value,
      minimumOrder: p.minimumOrder,
      maximumDiscount: p.maximumDiscount || 0,
      startDate: new Date(p.startDate).toISOString().slice(0, 10),
      endDate: new Date(p.endDate).toISOString().slice(0, 10),
      usageLimit: p.usageLimit || 0,
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        value: Number(formData.value),
        minimumOrder: Number(formData.minimumOrder),
        maximumDiscount: formData.type === 'PERCENT' ? Number(formData.maximumDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      if (editingPromo) {
        await apiClient(`/inventory/promotions/${editingPromo.id}`, {
          method: 'PUT',
          data: payload,
        });
        setMessage({ type: 'success', text: 'Cập nhật khuyến mãi thành công!' });
      } else {
        await apiClient('/inventory/promotions', {
          method: 'POST',
          data: payload,
        });
        setMessage({ type: 'success', text: 'Thêm mới mã khuyến mãi thành công!' });
      }
      setShowModal(false);
      fetchPromotions();
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
            <Tag className="w-6 h-6 text-amber-700" />
            <span>Chương Trình Khuyến Mãi &amp; Voucher</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Quản lý mã giảm giá, chiết khấu hóa đơn và điều kiện áp dụng khi khách hàng thanh toán.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#234232] hover:bg-[#182E23] text-[#FAF7EE] text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Mã Khuyến Mãi</span>
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

      {/* Promotions Grid */}
      {loading ? (
        <div className="text-center py-12 text-stone-400 text-xs">Đang tải danh sách khuyến mãi...</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-12 text-stone-400 text-xs">Chưa có chương trình khuyến mãi nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((p) => {
            const isExpired = new Date(p.endDate) < new Date();

            return (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {p.code}
                    </span>
                    <h3 className="font-serif font-bold text-base text-stone-900 mt-2">{p.name}</h3>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-900 transition"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-stone-600 border-t border-stone-100 pt-3">
                  <div className="flex justify-between">
                    <span>Mức giảm:</span>
                    <strong className="text-[#C25E2E] font-bold">
                      {p.type === 'PERCENT'
                        ? `${p.value}% (tối đa ${(p.maximumDiscount || 0).toLocaleString('vi-VN')} đ)`
                        : `${p.value.toLocaleString('vi-VN')} đ`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Đơn tối thiểu:</span>
                    <strong className="font-mono text-stone-800">
                      {p.minimumOrder.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Lượt đã dùng:</span>
                    <span className="font-mono">
                      {p.usedCount} {p.usageLimit ? `/ ${p.usageLimit}` : '(Không giới hạn)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] border-t border-stone-100 pt-3 text-stone-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Hết hạn: {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>
                  </span>

                  {isExpired ? (
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                      Hết Hạn
                    </span>
                  ) : p.isActive ? (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Đang Áp Dụng
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500 font-bold bg-stone-100 px-2 py-0.5 rounded-full">
                      Tạm Ngừng
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Thêm / Sửa Khuyến Mãi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900">
                {editingPromo ? 'Chỉnh Sửa Mã Khuyến Mãi' : 'Tạo Mã Khuyến Mãi Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mã Voucher (Code) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="GIAM10, WELCOME..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Loại giảm giá</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 bg-white"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tên chương trình khuyến mãi *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Giảm 10% mừng khai trương..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Giá trị giảm ({formData.type === 'PERCENT' ? '%' : 'đ'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 font-mono"
                  />
                </div>

                {formData.type === 'PERCENT' && (
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Giảm tối đa (đ)</label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={formData.maximumDiscount}
                      onChange={(e) => setFormData({ ...formData, maximumDiscount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Đơn hàng tối thiểu (đ)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={formData.minimumOrder}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                  />
                </div>
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
                  {submitting ? 'Đang lưu...' : editingPromo ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPromotionsPage;
