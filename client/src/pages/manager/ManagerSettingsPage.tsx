import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { RestaurantConfig } from '../../types';
import { Settings, Save, Check, AlertCircle } from 'lucide-react';

export const ManagerSettingsPage: React.FC = () => {
  const [configs, setConfigs] = useState<RestaurantConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await apiClient<RestaurantConfig[]>('/manager/configs');
      setConfigs(data);
    } catch (err) {
      console.error('Failed to load configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleValueChange = (key: string, value: string) => {
    setConfigs((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/manager/configs', {
        method: 'PUT',
        body: JSON.stringify(
          configs.map((c) => ({
            key: c.key,
            value: c.value,
            description: c.description,
          }))
        ),
      });
      setToast('Đã lưu cấu hình nhà hàng thành công');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert('Lỗi lưu cấu hình: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#234232] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Cấu Hình Thông Tin Nhà Hàng
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Tùy chỉnh thông tin hiển thị trên trang chủ, chân trang và trên phiếu hóa đơn thanh toán
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        {loading ? (
          <div className="h-64 animate-pulse bg-stone-50 rounded-xl"></div>
        ) : (
          <form onSubmit={handleSaveAll} className="space-y-4 text-xs">
            {configs.map((cfg) => (
              <div key={cfg.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800">
                    {cfg.description || cfg.key}:
                  </label>
                  <span className="font-mono text-[10px] text-stone-400">{cfg.key}</span>
                </div>
                <input
                  type="text"
                  value={cfg.value}
                  onChange={(e) => handleValueChange(cfg.key, e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-[#2E5540] text-stone-900"
                />
              </div>
            ))}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#234232] hover:bg-[#182E23] text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-amber-200" />
                <span>Lưu Tất Cả Cấu Hình</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManagerSettingsPage;
