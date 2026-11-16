import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  UtensilsCrossed,
} from 'lucide-react';
import apiClient from '../../api/client';
import { Recipe, Ingredient, MenuItem } from '../../types';

export const ManagerRecipesPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [recipeIngredients, setRecipeIngredients] = useState<
    Array<{ ingredientId: string; quantity: number; unit: string }>
  >([]);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, ingRes, menuRes] = await Promise.all([
        apiClient<Recipe[]>('/inventory/recipes'),
        apiClient<Ingredient[]>('/inventory/ingredients'),
        apiClient<MenuItem[]>('/menu/items'),
      ]);
      setRecipes(recRes);
      setIngredients(ingRes);
      setMenuItems(menuRes);
    } catch (err: any) {
      console.error('Lỗi tải công thức:', err);
      setMessage({ type: 'error', text: err.message || 'Không thể tải công thức món ăn' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenConfig = (menuItemId: string) => {
    setSelectedMenuItemId(menuItemId);
    const existing = recipes.find((r) => r.menuItemId === menuItemId);

    if (existing) {
      setDescription(existing.description || '');
      setRecipeIngredients(
        existing.ingredients.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          unit: i.unit,
        }))
      );
    } else {
      setDescription('');
      setRecipeIngredients([
        {
          ingredientId: ingredients[0]?.id || '',
          quantity: 0.1,
          unit: ingredients[0]?.unit || 'kg',
        },
      ]);
    }
    setShowModal(true);
  };

  const handleAddIngredientRow = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      {
        ingredientId: ingredients[0]?.id || '',
        quantity: 0.1,
        unit: ingredients[0]?.unit || 'kg',
      },
    ]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const updated = [...recipeIngredients];
    if (field === 'ingredientId') {
      const selectedIng = ingredients.find((i) => i.id === value);
      updated[index] = {
        ...updated[index],
        ingredientId: value,
        unit: selectedIng?.unit || updated[index].unit,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setRecipeIngredients(updated);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItemId) return;

    try {
      setSubmitting(true);
      await apiClient(`/inventory/recipes/menu-item/${selectedMenuItemId}`, {
        method: 'PUT',
        data: {
          description: description || undefined,
          ingredients: recipeIngredients.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: Number(i.quantity),
            unit: i.unit,
          })),
        },
      });

      setMessage({ type: 'success', text: 'Đã lưu cấu hình công thức định lượng thành công!' });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lưu công thức thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-700" />
            <span>Công Thức Món Ăn &amp; Định Lượng Nguyên Liệu</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Xác định thành phần nguyên liệu cho từng khẩu phần món. Hệ thống sẽ tự động trừ kho và cảnh báo khi thiếu nguyên liệu.
          </p>
        </div>
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
            placeholder="Tìm theo tên món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
          />
        </div>

        <button
          onClick={fetchData}
          className="p-2 border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-50 transition"
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Recipe List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-stone-400 text-xs">
            Đang tải dữ liệu công thức...
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-stone-400 text-xs">
            Không tìm thấy món ăn nào.
          </div>
        ) : (
          filteredMenuItems.map((item) => {
            const recipe = recipes.find((r) => r.menuItemId === item.id);
            const hasRecipe = recipe && recipe.ingredients.length > 0;

            // Check if any ingredient is short
            const isMissingAny = hasRecipe && recipe.ingredients.some(
              (ri) => (ri.ingredient?.availableStock ?? 0) < ri.quantity
            );

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-stone-900">{item.name}</h3>
                      <div className="text-xs font-mono font-bold text-[#C25E2E]">
                        {item.price.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenConfig(item.id)}
                    className="px-3 py-1.5 bg-[#234232] hover:bg-[#182E23] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{hasRecipe ? 'Sửa Công Thức' : 'Thiết Lập'}</span>
                  </button>
                </div>

                {/* Recipe details */}
                <div className="border-t border-stone-100 pt-3">
                  {!hasRecipe ? (
                    <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-400 italic">
                      Chưa cấu hình công thức định lượng cho món này.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-stone-500">
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                          Thành phần cho 1 phần ăn ({recipe.ingredients.length} nguyên liệu)
                        </span>
                        {isMissingAny ? (
                          <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Thiếu nguyên liệu</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đủ nguyên liệu</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {recipe.ingredients.map((ri, idx) => {
                          const available = ri.ingredient?.availableStock ?? 0;
                          const isShort = available < ri.quantity;

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                                isShort ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-stone-50 text-stone-700'
                              }`}
                            >
                              <span className="font-medium">{ri.ingredient?.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold">
                                  {ri.quantity} {ri.unit}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  (Kho còn: {available} {ri.ingredient?.unit})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Cấu hình công thức */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                  Cấu Hình Định Lượng
                </span>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  {menuItems.find((m) => m.id === selectedMenuItemId)?.name}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Mô tả công thức / quy trình chế biến</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Ướp sốt 15 phút, nướng nhiệt độ 220 độ C..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              {/* Ingredients in recipe */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                    Nguyên liệu cấu thành 1 phần
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold rounded-lg border border-stone-200 transition"
                  >
                    + Thêm nguyên liệu
                  </button>
                </div>

                <div className="space-y-2">
                  {recipeIngredients.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 items-center"
                    >
                      <div className="col-span-6">
                        <label className="block text-[10px] text-stone-500 mb-0.5">Nguyên liệu</label>
                        <select
                          value={item.ingredientId}
                          onChange={(e) => handleIngredientChange(idx, 'ingredientId', e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-stone-500 mb-0.5">Định lượng</label>
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          required
                          value={item.quantity}
                          onChange={(e) => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-stone-500 mb-0.5">Đơn vị</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                        />
                      </div>

                      <div className="col-span-1 flex items-end justify-center pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                  {submitting ? 'Đang lưu...' : 'Lưu Công Thức'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerRecipesPage;
