import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '../../types';
import apiClient from '../../api/client';
import {
  UtensilsCrossed,
  Sparkles,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  Award,
  Leaf,
  Eye,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const items = await apiClient<MenuItem[]>('/menu/items?isFeatured=true');
        setFeaturedItems(items.slice(0, 4));
      } catch (err) {
        console.error('Failed to load featured dishes', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-[#234232] text-white overflow-hidden py-20 lg:py-28 px-4 sm:px-6 lg:px-8 rounded-b-[2.5rem] shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF7EE_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3D6B52]/50 text-amber-200 border border-amber-300/30 text-xs tracking-wider uppercase font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chào mừng đến với SELF RESTAURANT</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FAF7EE] leading-tight max-w-4xl mx-auto">
            Tinh Hoa Ẩm Thực Tự Nhiên &amp; Trải Nghiệm Công Nghệ Đương Đại
          </h1>

          <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed font-light">
            Thưởng thức nghệ thuật ẩm thực độc đáo kết hợp cùng hệ thống gọi món kỹ thuật số thông minh tại bàn. Tươi ngon, minh bạch và chu đáo trong từng khoảnh khắc.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/menu"
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm shadow-lg hover:shadow-xl transition flex items-center gap-2 group"
            >
              <span>Khám Phá Thực Đơn</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <a
              href="#contact"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7EE] font-semibold text-sm border border-white/20 backdrop-blur-sm transition flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Giờ Phục Vụ &amp; Địa Chỉ</span>
            </a>
          </div>
        </div>
      </section>

      {/* Brand Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-[#3D6B52]/40 transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#2E5540] flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Nguyên Liệu Hữu Cơ Tuyển Chọn
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              100% thịt bò Wagyu, hải sản tươi sống và rau củ đạt chuẩn VietGAP, được nhập khẩu trực tiếp và kiểm định nghiêm ngặt mỗi sáng.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-[#3D6B52]/40 transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Bếp Trưởng &amp; Công Thức Độc Bản
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Đội ngũ bếp trưởng giàu năm kinh nghiệm với các món sốt nấu chậm gia truyền, tôn vinh độ ngọt nguyên bản của thực phẩm.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-[#3D6B52]/40 transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Hệ Thống Tự Động Minh Bạch
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Theo dõi trực tiếp quá trình bếp chế biến, thời gian chờ và quản lý hóa đơn thanh toán chính xác ngay trên thiết bị của quý khách.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Menu Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C25E2E]">
              Gợi Ý Từ Bếp Trưởng
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Món Ăn Nổi Bật &amp; Bán Chạy Nhất
            </h2>
          </div>
          <Link
            to="/menu"
            className="text-xs font-semibold text-[#2E5540] hover:text-[#182E23] flex items-center gap-1 group"
          >
            <span>Xem toàn bộ thực đơn</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-stone-200"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col group"
              >
                <div className="relative h-48 overflow-hidden bg-stone-100">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    Đặc Sắc
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-semibold text-stone-900 text-sm group-hover:text-[#2E5540] transition">
                      {item.name}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="font-bold text-sm text-[#C25E2E]">
                      {item.price.toLocaleString('vi-VN')} đ
                    </span>
                    <Link
                      to="/menu"
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem món</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Restaurant Contact & Hours */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF7EE] border border-[#ECE3CE] rounded-3xl p-8 lg:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-stone-800">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white rounded-xl shadow-sm text-[#2E5540] border border-stone-200">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">Địa Chỉ Nhà Hàng</h4>
                <p className="text-xs text-stone-600 mt-1">
                  88 Đường Hoa Lan, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">Bãi đỗ ô tô và xe máy rộng rãi miễn phí</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-3 bg-white rounded-xl shadow-sm text-[#2E5540] border border-stone-200">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">Giờ Phục Vụ</h4>
                <p className="text-xs text-stone-600 mt-1">
                  Thứ Hai - Chủ Nhật: 10:00 - 23:00
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">Phục vụ xuyên trưa &amp; nhận tiệc tối</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-3 bg-white rounded-xl shadow-sm text-[#2E5540] border border-stone-200">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">Liên Hệ &amp; Hỗ Trợ</h4>
                <p className="text-xs text-stone-600 mt-1 font-semibold">
                  028 3888 9999 - 0909 123 456
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">Email: contact@selfrestaurant.vn</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
