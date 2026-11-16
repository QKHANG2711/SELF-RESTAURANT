import React, { useState, useEffect } from 'react';
import { MenuItem, Category } from '../../types';
import apiClient from '../../api/client';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Clock,
  Layers,
} from 'lucide-react';

export const ManagerMenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Item Modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    price: 50000,
    description: '',
    imageUrl: '',
    isAvailable: true,
    isFeatured: false,
    preparationTimeMinutes: 15,
  });

  // Category Modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const [toast, setToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([
        apiClient<Category[]>('/menu/categories'),
        apiClient<MenuItem[]>('/menu/items', {
          params: {
            categoryId: selectedCatFilter !== 'all' ? selectedCatFilter : undefined,
            search: search || undefined,
          },
        }),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tải dữ liệu thực đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCatFilter, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      categoryId: categories[0]?.id || '',
      price: 100000,
      description: '',
      imageUrl: '',
      isAvailable: true,
      isFeatured: false,
      preparationTimeMinutes: 15,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      preparationTimeMinutes: item.preparationTimeMinutes,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (editingItem) {
        await apiClient(`/menu/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(itemForm),
        });
        showToast('Cập nhật món ăn thành công');
      } else {
        await apiClient('/menu/items', {
          method: 'POST',
          body: JSON.stringify(itemForm),
        });
        showToast('Thêm món ăn mới thành công');
      }
      setIsItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hoặc ngưng bán món "${item.name}"?`)) return;

    try {
      await apiClient(`/menu/items/${item.id}`, { method: 'DELETE' });
      showToast('Đã xử lý món ăn thành công');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await apiClient(`/menu/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      fetchData();
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

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Quản Lý Món Ăn &amp; Danh Mục
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Thêm, chỉnh sửa giá bán, cập nhật trạng thái còn bán và quản trị thực đơn nhà hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateItem}
            className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Món Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCatFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCatFilter === 'all'
                ? 'bg-[#234232] text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Tất cả ({menuItems.length})
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCatFilter === c.id
                  ? 'bg-[#234232] text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm tên món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2E5540]"
          />
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 divide-y divide-stone-100">
            <thead className="bg-stone-50 font-bold uppercase text-[10px] text-stone-500">
              <tr>
                <th className="py-3 px-4">Món Ăn</th>
                <th className="py-3 px-4">Danh Mục</th>
                <th className="py-3 px-4">Giá Bán</th>
                <th className="py-3 px-4">Thời Gian Nấu</th>
                <th className="py-3 px-4">Đặc Sắc</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {menuItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=100'}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border border-stone-200"
                      />
                      <div>
                        <div className="font-bold text-stone-900">{item.name}</div>
                        <div className="text-[11px] text-stone-400 line-clamp-1 max-w-xs">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{item.category?.name}</td>
                  <td className="py-3 px-4 font-bold text-[#C25E2E]">
                    {item.price.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-4 text-stone-500">{item.preparationTimeMinutes} phút</td>
                  <td className="py-3 px-4">
                    {item.isFeatured ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1 text-[11px]">
                        <Sparkles className="w-3 h-3" /> Nổi bật
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px]">Thường</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                      title="Nhấp để đổi trạng thái"
                    >
                      {item.isAvailable ? 'Đang phục vụ' : 'Tạm hết món'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditItem(item)}
                        className="p-1.5 text-stone-500 hover:text-[#234232] hover:bg-stone-100 rounded-lg transition"
                        title="Sửa món"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa món"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between p-4 bg-stone-50 border-b border-stone-200">
              <h3 className="font-bold text-sm text-stone-900">
                {editingItem ? `Chỉnh Sửa Món Ăn: ${editingItem.name}` : 'Thêm Món Ăn Mới'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên món ăn (*):</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Danh mục (*):</label>
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Giá bán (VND) (*):</label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mô tả món ăn:</label>
                <textarea
                  rows={2}
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">URL Hình ảnh món ăn:</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Thời gian nấu (phút):</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.preparationTimeMinutes}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, preparationTimeMinutes: parseInt(e.target.value) || 15 })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={itemForm.isFeatured}
                      onChange={(e) => setItemForm({ ...itemForm, isFeatured: e.target.checked })}
                      className="rounded text-[#2E5540]"
                    />
                    <span>Nổi bật</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={itemForm.isAvailable}
                      onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                      className="rounded text-[#2E5540]"
                    />
                    <span>Còn bán</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white rounded-xl font-bold shadow-sm"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMenuPage;
