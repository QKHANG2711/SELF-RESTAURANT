import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { AuditLog } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import { ShieldAlert, RotateCw, Search } from 'lucide-react';

export const ManagerAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ items: AuditLog[] }>('/manager/audit-logs', {
        params: { limit: 50 },
      });
      setLogs(res.items);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Nhật Ký Hoạt Động &amp; Kiểm Toán (Audit Logs)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Lưu lại toàn bộ lịch sử đăng nhập, thay đổi thực đơn, cập nhật đơn hàng và xác nhận thanh toán
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 transition shadow-sm flex items-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo hành động, người thực hiện, chi tiết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-[#2E5540]"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 divide-y divide-stone-100">
            <thead className="bg-stone-50 font-bold uppercase text-[10px] text-stone-500">
              <tr>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Người Thực Hiện</th>
                <th className="py-3 px-4">Hành Động</th>
                <th className="py-3 px-4">Đối Tượng</th>
                <th className="py-3 px-4">Chi Tiết Thao Tác</th>
                <th className="py-3 px-4">Địa Chỉ IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono text-stone-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{log.userEmail || 'Hệ thống'}</div>
                    {log.userRole && <StatusBadge status={log.userRole} size="sm" />}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#2E5540]">{log.action}</td>
                  <td className="py-3 px-4 text-stone-600">{log.entity}</td>
                  <td className="py-3 px-4 max-w-sm text-stone-800">{log.details || '-'}</td>
                  <td className="py-3 px-4 font-mono text-stone-400 text-[11px]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerAuditPage;
