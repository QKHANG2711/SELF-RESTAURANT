import React from 'react';
import { Invoice } from '../../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.createdAt).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 print:border-none print:shadow-none print:max-w-full">
        {/* Header toolbar (Hidden when printing) */}
        <div className="flex items-center justify-between p-4 bg-stone-50 border-b border-stone-200 print:hidden">
          <div className="flex items-center gap-2 text-stone-800 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Hóa Đơn Thanh Toán #{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#234232] text-white text-xs font-medium rounded-lg hover:bg-[#182E23] transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Hóa Đơn</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 text-stone-800 text-xs font-mono space-y-4 print:p-8">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-serif font-bold text-stone-900 tracking-wider">
              SELF RESTAURANT
            </h2>
            <p className="text-[11px] text-stone-500">88 Hoa Lan, P. 2, Q. Phú Nhuận, TP. HCM</p>
            <p className="text-[11px] text-stone-500">Hotline: 028 3888 9999 - 0909 123 456</p>
            <div className="border-b border-dashed border-stone-300 pt-2 pb-1">
              <span className="font-bold text-sm tracking-widest uppercase">PHIẾU THANH TOÁN</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-1 text-[11px]">
            <div>Số HĐ: <span className="font-bold">{invoice.invoiceNumber}</span></div>
            <div className="text-right">Bàn: <span className="font-bold text-sm">{invoice.tableCode}</span></div>
            <div>Ngày: <span>{formattedDate}</span></div>
            <div className="text-right">Khách: <span>{invoice.customerName || 'Khách vãng lai'}</span></div>
            <div>Hình thức: <span className="font-semibold">{invoice.paymentMethod}</span></div>
            <div className="text-right">Thu ngân: <span>Lê Thị Thu Ngân</span></div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-stone-300 py-2">
            <div className="grid grid-cols-12 font-bold mb-1 pb-1 border-b border-stone-200 text-[11px]">
              <div className="col-span-6">Tên Món</div>
              <div className="col-span-2 text-center">SL</div>
              <div className="col-span-4 text-right">Thành Tiền</div>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto print:max-h-none">
              {invoice.order?.items?.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px]">
                  <div className="col-span-6 truncate font-sans text-stone-900">
                    {item.menuItem?.name || 'Món ăn'}
                  </div>
                  <div className="col-span-2 text-center">{item.quantity}</div>
                  <div className="col-span-4 text-right">
                    {item.subtotal.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculation */}
          <div className="space-y-1 text-right text-[11px]">
            <div className="flex justify-between">
              <span>Cộng tiền món:</span>
              <span>{invoice.totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Giảm giá:</span>
                <span>-{invoice.discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between text-stone-500">
              <span>Thuế VAT (8%):</span>
              <span>Đã bao gồm</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-200">
              <span>TỔNG THANH TOÁN:</span>
              <span className="text-[#C25E2E]">{invoice.finalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-dashed border-stone-300 text-[10px] text-stone-500 space-y-0.5">
            <p className="font-sans font-semibold text-stone-700">Cảm ơn Quý Khách & Hẹn Gặp Lại!</p>
            <p>Wifi: SELF_GUEST (MK: selfrest2026)</p>
            <p>Hóa đơn điện tử khởi tạo từ hệ thống Self Restaurant</p>
          </div>
        </div>

        {/* Modal footer (Hidden when printing) */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg hover:bg-stone-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
