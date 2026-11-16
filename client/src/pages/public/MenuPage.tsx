import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuItem, Category } from '../../types';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Check,
  X,
  Clock,
  Sparkles,
  Info,
  ClipboardList,
  Eye,
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableOnly, setAvailableOnly] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected item modal state
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, items] = await Promise.all([
          apiClient<Category[]>('/menu/categories'),
          apiClient<MenuItem[]>('/menu/items', {
            params: {
              categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
              search: searchQuery || undefined,
              availableOnly: availableOnly ? true : undefined,
            },
          }),
        ]);
        setCategories(cats);
        setMenuItems(items);
      } catch (err) {
        console.error('Error fetching menu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchQuery, availableOnly]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Thực Đơn Nhà Hàng</h1>
          <p className="text-xs text-stone-500 mt-1">
            Chọn món tươi ngon, chế biến nóng hổi và phục vụ chu đáo tới từng bàn ăn
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn, hương vị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E5540] transition"
            />
          </div>

          {/* Toggle Available Only */}
          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none bg-stone-100 px-3 py-2 rounded-xl">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded text-[#2E5540] focus:ring-[#2E5540]"
            />
            <span>Chỉ món còn bán</span>
          </label>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-[#234232] text-white shadow-sm'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Tất Cả Món
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-[#234232] text-white shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-stone-200"></div>
          ))}
        </div>
      ) : menuItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
          <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-stone-800 text-sm">Không tìm thấy món ăn phù hợp</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Vui lòng thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc trạng thái.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl overflow-hidden border transition flex flex-col justify-between group shadow-sm hover:shadow-md ${
                item.isAvailable ? 'border-stone-200' : 'border-stone-200 opacity-60'
              }`}
            >
              <div className="relative h-48 bg-stone-100 overflow-hidden cursor-pointer" onClick={() => setActiveModalItem(item)}>
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {item.isFeatured && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Đặc Sắc</span>
                  </div>
                )}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                      Tạm Hết Món
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="cursor-pointer" onClick={() => setActiveModalItem(item)}>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                    <span>{item.category?.name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.preparationTimeMinutes} phút
                    </span>
                  </div>
                  <h4 className="font-semibold text-stone-900 text-sm group-hover:text-[#2E5540] transition">
                    {item.name}
                  </h4>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Đơn giá</span>
                    <span className="font-bold text-sm text-[#C25E2E]">
                      {item.price.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {item.isAvailable ? (
                    <button
                      onClick={() => setActiveModalItem(item)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem món</span>
                    </button>
                  ) : (
                    <span className="text-xs text-rose-500 font-medium">Ngưng bán</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dish Detail Modal (View Only for Customer; Waiter shortcut if staff) */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
            <div className="relative h-60 bg-stone-100">
              <img
                src={activeModalItem.imageUrl || 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600'}
                alt={activeModalItem.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveModalItem(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-[#2E5540] uppercase tracking-wider">
                  {activeModalItem.category?.name}
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">
                  {activeModalItem.name}
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {activeModalItem.description}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                <div className="flex items-center gap-1 text-stone-600">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span>Thời gian chế biến: <strong>{activeModalItem.preparationTimeMinutes} phút</strong></span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-base text-[#C25E2E]">
                    {activeModalItem.price.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Notice for customer vs staff */}
              {user?.role === 'WAITER' || user?.role === 'MANAGER' ? (
                <button
                  onClick={() => {
                    setActiveModalItem(null);
                    navigate('/waiter');
                  }}
                  className="w-full py-3 bg-violet-800 hover:bg-violet-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Vào Màn Hình Phục Vụ Để Gọi Món Cho Bàn</span>
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Quý khách vui lòng liên hệ nhân viên phục vụ (WAITER) tại bàn để được phục vụ món ăn này.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
