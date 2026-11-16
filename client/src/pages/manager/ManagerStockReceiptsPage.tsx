import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Truck,
  Package,
} from 'lucide-react';
import apiClient from '../../api/client';
import { StockReceipt, Supplier, Ingredient } from '../../types';

export const ManagerStockReceiptsPage: React.FC = () => {
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [viewingReceipt, setViewingReceipt] = useState<StockReceipt | null>(null);

  // New receipt form state
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierInvoice, setSupplierInvoice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<
    Array<{ ingredientId: string; quantity: number; unit: string; costPrice: number }>
  >([]);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [receiptRes, supRes, ingRes] = await Promise.all([
        apiClient<StockReceipt[]>('/inventory/stock-receipts', {
          params: { status: statusFilter !== 'all' ? statusFilter : undefined },
        }),
        apiClient<Supplier[]>('/inventory/suppliers'),
        apiClient<Ingredient[]>('/inventory/ingredients'),
      ]);
      setReceipts(receiptRes);
      setSuppliers(supRes);
      setIngredients(ingRes);
    } catch (err: any) {
      console.error('Lỗi tải phiếu nhập:', err);
      setMessage({ type: 'error', text: err.message || 'Không thể tải danh sách phiếu nhập' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setSupplierId(suppliers[0]?.id || '');
    setSupplierInvoice('');
    setNotes('');
    setItems([
      {
        ingredientId: ingredients[0]?.id || '',
        quantity: 10,
        unit: ingredients[0]?.unit || 'kg',
        costPrice: 50000,
      },
    ]);
    setShowCreateModal(true);
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        ingredientId: ingredients[0]?.id || '',
        quantity: 1,
        unit: ingredients[0]?.unit || 'kg',
        costPrice: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
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
    setItems(updated);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.costPrice || 0), 0);
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn nhà cung cấp' });
      return;
    }
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Phiếu nhập phải có ít nhất 1 dòng nguyên liệu' });
      return;
    }

    try {
      setSubmitting(true);
      await apiClient('/inventory/stock-receipts', {
        method: 'POST',
        data: {
          supplierId,
          supplierInvoice: supplierInvoice || undefined,
          notes: notes || undefined,
          items: items.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: Number(i.quantity),
            unit: i.unit,
            costPrice: Number(i.costPrice),
          })),
        },
      });

      setMessage({ type: 'success', text: 'Đã lập phiếu nhập kho (bản nháp) thành công!' });
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lập phiếu nhập thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReceipt = async (id: string) => {
    if (!window.confirm('Xác nhận nhập kho phiếu này? Sau khi xác nhận, tồn kho sẽ tự động tăng tương ứng.')) {
      return;
    }

    try {
      setSubmitting(true);
      await apiClient(`/inventory/stock-receipts/${id}/confirm`, {
        method: 'POST',
      });
      setMessage({ type: 'success', text: 'Đã xác nhận nhập kho thành công! Số lượng tồn kho đã được cộng.' });
      if (viewingReceipt?.id === id) {
        setViewingReceipt(null);
      }
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Xác nhận nhập kho thất bại' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReceipt = async (id: string) => {
    try {
      const data = await apiClient<StockReceipt>(`/inventory/stock-receipts/${id}`);
      setViewingReceipt(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể xem chi tiết phiếu nhập' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-700" />
            <span>Phiếu Nhập Kho Nguyên Liệu</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Quản lý quy trình nhập hàng từ nhà cung cấp, kiểm duyệt và cập nhật số lượng tồn kho tự động.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#234232] hover:bg-[#182E23] text-[#FAF7EE] text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiếu Nhập Kho</span>
        </button>
      </div>

      {/* Message Alert */}
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-stone-700">Trạng thái:</span>
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === 'all' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === 'DRAFT' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'
              }`}
            >
              Bản Nháp (Chưa Nhập)
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === 'CONFIRMED' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'
              }`}
            >
              Đã Nhập Kho
            </button>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2 border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-50 transition"
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200 font-bold">
              <tr>
                <th className="px-4 py-3.5">Mã Phiếu</th>
                <th className="px-4 py-3.5">Nhà Cung Cấp</th>
                <th className="px-4 py-3.5">Hóa Đơn NCC</th>
                <th className="px-4 py-3.5 text-center">Số Loại NL</th>
                <th className="px-4 py-3.5 text-right">Tổng Giá Trị</th>
                <th className="px-4 py-3.5">Thời Gian Lập</th>
                <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                <th className="px-4 py-3.5 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                    Đang tải danh sách phiếu nhập...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                    Chưa có phiếu nhập kho nào.
                  </td>
                </tr>
              ) : (
                receipts.map((r) => {
                  const isConfirmed = r.status === 'CONFIRMED';
                  return (
                    <tr key={r.id} className="hover:bg-stone-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-stone-800">{r.receiptNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-stone-900">{r.supplier?.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{r.supplier?.supplierCode}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-stone-600">{r.supplierInvoice || '—'}</td>
                      <td className="px-4 py-3 text-center">{r._count?.items || 0} món</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#C25E2E]">
                        {r.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {new Date(r.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Đã Nhập Kho</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Bản Nháp</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewReceipt(r.id)}
                            className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-600 transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isConfirmed && (
                            <button
                              onClick={() => handleConfirmReceipt(r.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-lg shadow-xs transition"
                            >
                              Xác Nhận Nhập
                            </button>
                          )}
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

      {/* Modal: Tạo Phiếu Nhập Kho */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-700" />
                <span>Tạo Phiếu Nhập Kho Nguyên Liệu Mới</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nhà cung cấp *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.supplierCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Số hóa đơn / chứng từ NCC</label>
                  <input
                    type="text"
                    value={supplierInvoice}
                    onChange={(e) => setSupplierInvoice(e.target.value)}
                    placeholder="Ví dụ: HD-9923..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ghi chú phiếu nhập</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú về tình trạng hàng, hạn sử dụng..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#234232]/20"
                />
              </div>

              {/* Items List */}
              <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-700" />
                    <span>Danh sách nguyên liệu nhập</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-800 text-[11px] font-bold rounded-lg border border-stone-200 transition"
                  >
                    + Thêm dòng
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-xl border border-stone-200 items-center"
                    >
                      <div className="col-span-4">
                        <label className="block text-[10px] text-stone-500 mb-0.5">Nguyên liệu</label>
                        <select
                          value={item.ingredientId}
                          onChange={(e) => handleItemChange(idx, 'ingredientId', e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-stone-500 mb-0.5">Số lượng</label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-stone-500 mb-0.5">Đơn vị</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-stone-500 mb-0.5">Đơn giá nhập (đ)</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.costPrice}
                          onChange={(e) => handleItemChange(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-1 flex items-end justify-center pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 px-1 text-stone-800">
                  <span className="font-semibold">Tổng giá trị phiếu:</span>
                  <span className="font-serif font-bold text-base text-[#C25E2E]">
                    {calculateGrandTotal().toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Lưu Bản Nháp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xem chi tiết phiếu nhập */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Chi Tiết Phiếu</span>
                <h3 className="font-serif font-bold text-lg text-stone-900">{viewingReceipt.receiptNumber}</h3>
              </div>
              <button onClick={() => setViewingReceipt(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100">
              <div>
                <span className="text-stone-500">Nhà cung cấp:</span>
                <div className="font-bold text-stone-900">{viewingReceipt.supplier?.name}</div>
              </div>
              <div>
                <span className="text-stone-500">Hóa đơn NCC:</span>
                <div className="font-mono text-stone-900">{viewingReceipt.supplierInvoice || '—'}</div>
              </div>
              <div>
                <span className="text-stone-500">Trạng thái:</span>
                <div>
                  {viewingReceipt.status === 'CONFIRMED' ? (
                    <span className="text-emerald-700 font-bold">Đã nhập kho</span>
                  ) : (
                    <span className="text-amber-700 font-bold">Bản nháp (chưa nhập)</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-stone-500">Ngày lập:</span>
                <div className="text-stone-900">{new Date(viewingReceipt.createdAt).toLocaleString('vi-VN')}</div>
              </div>
            </div>

            {/* Receipt Items */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-stone-700 uppercase">Chi tiết nguyên liệu:</span>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 text-[10px]">
                    <tr>
                      <th className="p-2.5">Nguyên liệu</th>
                      <th className="p-2.5 text-right">Số lượng</th>
                      <th className="p-2.5 text-right">Đơn giá</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {viewingReceipt.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-stone-900">{item.ingredient?.name}</td>
                        <td className="p-2.5 text-right font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2.5 text-right font-mono">{item.costPrice.toLocaleString('vi-VN')} đ</td>
                        <td className="p-2.5 text-right font-mono font-bold text-stone-900">
                          {item.subtotal.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <span className="font-bold text-xs text-stone-700">Tổng tiền thanh toán:</span>
              <span className="font-serif font-bold text-lg text-[#C25E2E]">
                {viewingReceipt.totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {viewingReceipt.status === 'DRAFT' && (
                <button
                  onClick={() => handleConfirmReceipt(viewingReceipt.id)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Xác Nhận Nhập Kho Ngay
                </button>
              )}
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerStockReceiptsPage;
