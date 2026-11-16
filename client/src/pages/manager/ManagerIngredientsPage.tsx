import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit2,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import apiClient from '../../api/client';
import { Ingredient } from '../../types';

export const ManagerIngredientsPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    category: 'Thịt & Hải sản',
    minimumStock: 5,
    notes: '',
  });

  const [adjustData, setAdjustData] = useState({
    quantity: 0,
    notes: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const [ingRes, catRes] = await Promise.all([
        apiClient<Ingredient[]>('/inventory/ingredients', {
          params: {
            search: search || undefined,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            lowStock: lowStockOnly ? 'true' : undefined,
          },
        }),
        apiClient<string[]>('/inventory/ingredient-categories'),
      ]);
      setIngredients(ingRes);
      setCategories(catRes);
    } catch (err: any) {
      console.error('Lỗi khi tải nguyên liệu:', err);
      setMessage({ type: 'error', text: err.message || 'Không thể tải danh sách nguyên liệu' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [search, selectedCategory, lowStockOnly]);

  const handleOpenAdd = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      unit: 'kg',
      category: categories[0] || 'Gia vị & Khác',
      minimumStock: 5,
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setFormData({
      name: ing.name,
      unit: ing.unit,
      category: ing.category || 'Khác',
      minimumStock: ing.minimumStock,
      notes: ing.notes || '',
    });
    setShowAddModal(true);
  };

  const handleOpenAdjust = (ing: Ingredient) => {
    setAdjustingIngredient(ing);
    setAdjustData({ quantity: 0, notes: '' });
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingIngredient) {
        await apiClient(`/inventory/ingredients/${editingIngredient.id}`, {
          method: 'PUT',
          data: formData,
        });
        setMessage({ type: 'success', text: 'Cập nhật nguyên liệu thành công!' });
      } else {
        await apiClient('/inventory/ingredients', {
          method: 'POST',
          data: formData,
        });
        setMessage({ type: 'success', text: 'Thêm mới nguyên liệu thành công!' });
      }
      setShowAddModal(false);
      fetchIngredients();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Thao tác thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingIngredient) return;
    try {
      setSubmitting(true);
      await apiClient(`/inventory/ingredients/${adjustingIngredient.id}/adjust-stock`, {
        method: 'POST',
        data: adjustData,
      });
      setMessage({ type: 'success', text: 'Điều chỉnh tồn kho thành công!' });
      setAdjustingIngredient(null);
      fetchIngredients();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Điều chỉnh tồn kho thất bại' });
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
            <Package className="w-6 h-6 text-amber-700" />
            <span>Quản Lý Nguyên Liệu &amp; Tồn Kho</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Theo dõi lượng tồn kho thực tế, số lượng giữ chỗ cho đơn đang phục vụ và cảnh báo thiếu hụt.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#234232] hover:bg-[#182E23] text-[#FAF7EE] text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nguyên Liệu</span>
        </button>
      </div>

      {/* Message notification */}
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã nguyên liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 focus:border-[#234232]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#234232]/20 text-stone-700"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition shrink-0 ${
              lowStockOnly
                ? 'bg-amber-500 text-stone-950 border-amber-600 font-bold'
                : 'border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Chỉ xem Sắp hết / Hết</span>
          </button>

          <button
            onClick={fetchIngredients}
            className="p-2 border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-50 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200 font-bold">
              <tr>
                <th className="px-4 py-3.5">Mã NL</th>
                <th className="px-4 py-3.5">Tên Nguyên Liệu</th>
                <th className="px-4 py-3.5">Nhóm</th>
                <th className="px-4 py-3.5 text-right">Tồn Kho Thực Tế</th>
                <th className="px-4 py-3.5 text-right">Đang Giữ Chỗ</th>
                <th className="px-4 py-3.5 text-right">Khả Dụng</th>
                <th className="px-4 py-3.5 text-right">Định Mức Tối Thiểu</th>
                <th className="px-4 py-3.5">Đơn Vị</th>
                <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                <th className="px-4 py-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-stone-400">
                    Đang tải dữ liệu kho nguyên liệu...
                  </td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-stone-400">
                    Không tìm thấy nguyên liệu nào phù hợp.
                  </td>
                </tr>
              ) : (
                ingredients.map((ing) => {
                  const isOutOfStock = ing.stockStatus === 'OUT_OF_STOCK';
                  const isLowStock = ing.stockStatus === 'LOW_STOCK';

                  return (
                    <tr
                      key={ing.id}
                      className={`hover:bg-stone-50/80 transition ${
                        isOutOfStock ? 'bg-rose-50/30' : isLowStock ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-stone-600">{ing.ingredientCode}</td>
                      <td className="px-4 py-3 font-semibold text-stone-900">{ing.name}</td>
                      <td className="px-4 py-3 text-stone-600">{ing.category || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">
                        {ing.currentStock.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-700">
                        {ing.reservedStock.toLocaleString('vi-VN')}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${
                          ing.availableStock <= 0
                            ? 'text-rose-600'
                            : ing.availableStock <= ing.minimumStock
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {ing.availableStock.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-stone-500">
                        {ing.minimumStock.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{ing.unit}</td>
                      <td className="px-4 py-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>Hết Hàng</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Sắp Hết</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đủ Tồn</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(ing)}
                            className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-600 transition"
                            title="Điều chỉnh tồn kho"
                          >
                            <Sliders className="w-3.5 h-3.5 text-amber-700" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(ing)}
                            className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-600 transition"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-sky-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Thêm / Sửa Nguyên Liệu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900">
                {editingIngredient ? 'Chỉnh Sửa Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tên nguyên liệu *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Thịt bò Wagyu, Gạo tấm..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="kg, g, lít, lon, chai..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nhóm nguyên liệu</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Thịt, Rau củ, Gia vị..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Mức tồn kho tối thiểu (Cảnh báo khi dưới mức này)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về nguồn gốc, quy cách bảo quản..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingIngredient ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Điều chỉnh tồn kho */}
      {adjustingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Điều Chỉnh Tồn Kho: {adjustingIngredient.name}
              </h3>
              <button onClick={() => setAdjustingIngredient(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3.5 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
                <div className="flex justify-between text-stone-500">
                  <span>Tồn hiện tại:</span>
                  <strong className="font-mono text-stone-900">
                    {adjustingIngredient.currentStock} {adjustingIngredient.unit}
                  </strong>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Tồn sau điều chỉnh:</span>
                  <strong
                    className={`font-mono ${
                      adjustingIngredient.currentStock + adjustData.quantity < 0
                        ? 'text-rose-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {(adjustingIngredient.currentStock + adjustData.quantity).toFixed(2)}{' '}
                    {adjustingIngredient.unit}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Số lượng thay đổi (dương là cộng thêm, âm là trừ đi) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="Ví dụ: 5 hoặc -2.5"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Lý do điều chỉnh</label>
                <input
                  type="text"
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  placeholder="Kiểm kê định kỳ, hao hụt, hư hỏng..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustingIngredient(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || adjustingIngredient.currentStock + adjustData.quantity < 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Xác Nhận Điều Chỉnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerIngredientsPage;
