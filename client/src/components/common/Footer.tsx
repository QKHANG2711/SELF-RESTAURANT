import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#182E23] text-stone-300 border-t border-[#234232] text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                SR
              </div>
              <span className="font-serif font-bold text-base text-[#FAF7EE] tracking-tight">
                SELF RESTAURANT
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              Hệ thống quản lý nhà hàng thông minh chuyên nghiệp, kết nối thực khách, bếp chế biến, thu ngân và quản lý trên một nền tảng đồng bộ.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Khám Phá</h4>
            <ul className="space-y-1.5 text-stone-400">
              <li><Link to="/" className="hover:text-white transition">Trang Chủ</Link></li>
              <li><Link to="/menu" className="hover:text-white transition">Thực Đơn Đầy Đủ</Link></li>
              <li><Link to="/order" className="hover:text-white transition">Gọi Món Tại Bàn</Link></li>
              <li><Link to="/customer/orders" className="hover:text-white transition">Lịch Sử Đơn Của Tôi</Link></li>
            </ul>
          </div>

          {/* Management Portals */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Cổng Nghiệp Vụ</h4>
            <ul className="space-y-1.5 text-stone-400">
              <li><Link to="/chef" className="hover:text-white transition">Màn Hình Điều Phối Bếp (KDS)</Link></li>
              <li><Link to="/cashier" className="hover:text-white transition">Quầy Thu Ngân &amp; Bán Hàng</Link></li>
              <li><Link to="/manager" className="hover:text-white transition">Hệ Thống Quản Trị Quản Lý</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Đăng Nhập Phân Quyền</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Liên Hệ</h4>
            <p className="text-stone-400 leading-relaxed">
              88 Đường Hoa Lan, Phường 2, Q. Phú Nhuận, TP. Hồ Chí Minh
            </p>
            <p className="text-stone-400">Hotline: 028 3888 9999</p>
            <p className="text-stone-400">Giờ mở cửa: 10:00 - 23:00</p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#234232] flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-2">
          <div>
            © {new Date().getFullYear()} <strong>SELF RESTAURANT</strong>. Hệ Thống Quản Lý Nhà Hàng Đồ Án Tốt Nghiệp Kỹ Thuật Phần Mềm.
          </div>
          <div className="flex items-center gap-1">
            <span>Thiết kế &amp; Phát triển full-stack</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Node.js, Express, React, TypeScript, Prisma</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
