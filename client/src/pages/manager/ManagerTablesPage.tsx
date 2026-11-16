import React, { useState, useEffect } from 'react';
import { RestaurantTable, RestaurantArea } from '../../types';
import apiClient from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Plus,
  QrCode,
  Layers,
  RotateCcw,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const ManagerTablesPage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New table modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [tableCode, setTableCode] = useState<string>('');
  const [areaId, setAreaId] = useState<string>('');
  const [capacity, setCapacity] = useState<number>(4);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tableList, areaList] = await Promise.all([
        apiClient<RestaurantTable[]>('/tables'),
        apiClient<RestaurantArea[]>('/tables/areas'),
      ]);
      setTables(tableList);
      setAreas(areaList);
      if (areaList.length > 0) setAreaId(areaList[0].id);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await apiClient('/tables', {
        method: 'POST',
        body: JSON.stringify({ tableCode, areaId, capacity }),
      });
      showToast(`Đã tạo bàn ${tableCode} thành công`);
      setIsModalOpen(false);
      setTableCode('');
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleResetTable = async (table: RestaurantTable) => {
    if (!window.confirm(`Bạn có chắc muốn giải phóng bàn ${table.tableCode} về trạng thái Trống?`)) return;

    try {
      await apiClient(`/tables/${table.id}/reset`, { method: 'POST' });
      showToast(`Bàn ${table.tableCode} đã được giải phóng về trạng thái Trống`);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Quản Lý Bàn &amp; Sơ Đồ Khu Vực
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Thiết lập danh mục bàn ăn, sức chứa, liên kết khu vực và tạo mã QR gọi món
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Bàn Mới</span>
        </button>
      </div>

      {/* Area summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {areas.map((area) => {
          const areaTables = tables.filter((t) => t.areaId === area.id);
          return (
            <div key={area.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-stone-900">{area.name}</span>
                <span className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold">
                  Tầng {area.floor}
                </span>
              </div>
              <p className="text-xs text-stone-500">{area.description || 'Khu vực phục vụ khách'}</p>
              <div className="text-xs font-bold text-[#2E5540] pt-2 border-t border-stone-100">
                {areaTables.length} bàn ăn đang hoạt động
              </div>
            </div>
          );
        })}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => {
          const qrUrl = `/table/${table.tableCode}`;

          return (
            <div
              key={table.id}
              className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-stone-300 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-xl text-stone-900">
                    Bàn {table.tableCode}
                  </span>
                  <StatusBadge status={table.status} size="sm" />
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {table.areaName} • Sức chứa: <strong>{table.capacity} người</strong>
                </div>
              </div>

              {/* QR Code link preview */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-700">
                  <QrCode className="w-4 h-4 text-[#2E5540]" />
                  <span className="font-mono text-[11px]">{qrUrl}</span>
                </div>
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2E5540] hover:text-[#182E23] p-1"
                  title="Mở trang đặt món"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                {table.status !== 'AVAILABLE' ? (
                  <button
                    onClick={() => handleResetTable(table)}
                    className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Giải phóng bàn</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-semibold">Sẵn sàng đón khách</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-sm text-stone-900">Thêm Bàn Ăn Mới</h3>
            <form onSubmit={handleCreateTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Mã bàn (Ví dụ: A06, VIP03):</label>
                <input
                  type="text"
                  required
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Khu vực:</label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Tầng {a.floor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Sức chứa (Người):</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 4)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#234232] hover:bg-[#182E23] text-white rounded-xl font-bold shadow-sm"
                >
                  Tạo Bàn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTablesPage;
