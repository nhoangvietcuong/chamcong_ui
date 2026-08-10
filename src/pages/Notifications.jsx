import React, { useState, useEffect, useCallback } from 'react';
import { FiBell, FiCheckSquare, FiTrash, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import Card from '../components/Card';
import useApp from '../hooks/useApp';
import dashboardService from '../services/dashboardService';
import dayjs from 'dayjs';

export const Notifications = () => {
  const { toast } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read/deleted list in local storage for simulate persistence
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('read_notification_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedIds, setDeletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('deleted_notification_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getSystemLogs();
      if (res && res.success && res.data) {
        // Map logs to notification format
        const items = (res.data.items || []).map(log => {
          let type = 'info';
          let title = 'Thông báo hệ thống';

          if (log.status === 'FAILED' || log.action.includes('FAILED') || log.action.includes('ERROR')) {
            type = 'warning';
            title = `Cảnh báo: ${log.action}`;
          } else if (log.status === 'SUCCESS' || log.action.includes('SUCCESS') || log.action.includes('REGISTER') || log.action.includes('CREATE') || log.action.includes('ENABLED')) {
            type = 'success';
            title = log.action;
          }

          return {
            id: log.logId,
            title,
            desc: log.description,
            time: dayjs(log.actionTime).format('DD/MM/YYYY HH:mm'),
            rawTime: log.actionTime,
            type,
            fullName: log.fullName,
            employeeCode: log.employeeCode
          };
        });
        setNotifications(items);
      }
    } catch (err) {
      toast.error('Lỗi tải danh sách thông báo hệ thống');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem('read_notification_ids', JSON.stringify(updated));
    toast.success('Đã đánh dấu đọc tất cả thông báo');
  };

  const handleClearAll = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...deletedIds, ...allIds]));
    setDeletedIds(updated);
    localStorage.setItem('deleted_notification_ids', JSON.stringify(updated));
    toast.success('Đã xóa tất cả thông báo');
  };

  const handleToggleRead = (id) => {
    let updated;
    if (readIds.includes(id)) {
      updated = readIds.filter(x => x !== id);
    } else {
      updated = [...readIds, id];
    }
    setReadIds(updated);
    localStorage.setItem('read_notification_ids', JSON.stringify(updated));
  };

  const handleDeleteOne = (id, e) => {
    e.stopPropagation(); // Avoid triggering read toggle
    const updated = [...deletedIds, id];
    setDeletedIds(updated);
    localStorage.setItem('deleted_notification_ids', JSON.stringify(updated));
    toast.success('Đã xóa thông báo');
  };

  // Filter out deleted notifications
  const visibleNotifications = notifications.filter(n => !deletedIds.includes(n.id));

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiBell className="w-5 h-5 text-primary-600" />
            Trung tâm thông báo hệ thống
          </h1>
          <p className="text-xs text-slate-500">Giám sát các thông báo quan trọng về chấm công và quản lý tài khoản thiết bị toàn hệ thống</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors disabled:opacity-60 bg-white dark:bg-slate-900"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button 
            onClick={handleMarkAllRead}
            disabled={visibleNotifications.length === 0}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 text-xs font-semibold flex items-center gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all disabled:opacity-50"
          >
            <FiCheckSquare className="w-3.5 h-3.5" />
            Đọc tất cả
          </button>
          <button 
            onClick={handleClearAll}
            disabled={visibleNotifications.length === 0}
            className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 bg-white dark:bg-slate-900 text-rose-600 border-rose-100 dark:border-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-all disabled:opacity-50"
          >
            <FiTrash className="w-3.5 h-3.5" />
            Xóa tất cả
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hộp thư thông báo</h3>
        
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Đang tải thông báo hệ thống...</div>
        ) : visibleNotifications.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border-none shadow-sm rounded-2xl">
            <FiBell className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-semibold">Hộp thư trống</p>
            <p className="text-xs text-slate-400">Bạn đã xem hết tất cả thông báo hệ thống gần đây</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map((item) => {
              const isRead = readIds.includes(item.id);
              return (
                <Card 
                  key={item.id} 
                  onClick={() => handleToggleRead(item.id)}
                  className={`p-4 border-l-4 text-left flex justify-between gap-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-all bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 shadow-sm rounded-2xl relative ${
                    isRead ? 'opacity-65 border-l-slate-300 dark:border-l-slate-700' : 'border-l-primary-500 font-medium'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.type === 'warning' ? (
                        <FiAlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : item.type === 'success' ? (
                        <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <FiInfo className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs font-bold ${isRead ? 'text-slate-650 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {item.title}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mt-0.5">
                        {item.desc}
                      </p>
                      {item.fullName && (
                        <span className="text-[10px] text-slate-400 mt-1">
                          Liên quan: <strong className="font-semibold text-slate-500">{item.fullName} ({item.employeeCode})</strong>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 mt-1 font-mono font-medium">{item.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-650 shrink-0" title="Chưa đọc" />
                    )}
                    <button
                      onClick={(e) => handleDeleteOne(item.id, e)}
                      title="Xóa thông báo"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-all shrink-0"
                    >
                      <FiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
