import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiLayers, FiSearch, FiFilter, FiDownload, FiPrinter, 
  FiEye, FiCpu, FiUser, FiInfo, FiActivity, FiRefreshCw 
} from 'react-icons/fi';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import SearchBox from '../components/SearchBox';
import Select from '../components/Select';
import useApp from '../hooks/useApp';
import usePagination from '../hooks/usePagination';
import dashboardService from '../services/dashboardService';
import dayjs from 'dayjs';

export const AuditLogs = () => {
  const { toast } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        keyword: keyword || undefined,
        status: statusFilter || undefined
      };
      const res = await dashboardService.getAuditLogs(params);
      if (res && res.success && res.data) {
        setLogs(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải nhật ký kiểm toán');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, statusFilter, setTotal, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (val) => {
    setKeyword(val);
    resetPagination();
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    resetPagination();
  };

  const headers = [
    { key: 'logId', label: 'ID', sortable: false, width: '80px' },
    { key: 'username', label: 'Tài khoản', sortable: false },
    { key: 'action', label: 'Hành động & Hoạt động', sortable: false },
    { key: 'ipAddress', label: 'IP Address', sortable: false, width: '130px' },
    { key: 'status', label: 'Trạng thái', sortable: false, width: '120px' },
    { key: 'actionTime', label: 'Thời gian', sortable: false, width: '180px' },
    { key: 'actions', label: 'Chi tiết', sortable: false, width: '80px' },
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiLayers className="w-5 h-5 text-primary-600" />
            Nhật ký kiểm toán hệ thống
          </h1>
          <p className="text-xs text-slate-500">Giám sát vết hoạt động, tác vụ cấu hình hệ thống, và các lệnh API của người dùng</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors disabled:opacity-60 bg-white dark:bg-slate-900"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filters Card */}
      <Card className="p-4 border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <SearchBox 
              value={keyword} 
              onChange={handleSearch} 
              placeholder="Tìm theo hành động, tên nhân viên, mô tả nhật ký..." 
            />
          </div>
          <Select
            name="status"
            value={statusFilter}
            onChange={handleStatusFilter}
            options={[
              { value: 'SUCCESS', label: 'Thành công (SUCCESS)' },
              { value: 'FAILED', label: 'Thất bại (FAILED)' }
            ]}
            placeholder="Tất cả kết quả"
          />
        </div>
      </Card>

      {/* Table Section */}
      <Card className="flex flex-col gap-5">
        <Table
          headers={headers}
          items={logs}
          loading={loading}
          emptyState={
            <Card className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white dark:bg-slate-900 border-none">
              <FiLayers className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Không tìm thấy nhật ký kiểm toán nào</p>
              <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra bộ lọc</p>
            </Card>
          }
          renderRow={(log) => (
            <>
              <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                #{log.logId}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{log.username || 'System'}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">{log.role || 'Hệ thống'}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 truncate max-w-[320px]">{log.description}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                {log.ipAddress || '—'}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/35'}`}>
                  {log.status}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-slate-650 dark:text-slate-400">
                {dayjs(log.actionTime).format('HH:mm:ss DD/MM/YYYY')}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => setSelectedAudit(log)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
                >
                  <FiEye className="w-4 h-4" />
                </button>
              </td>
            </>
          )}
          pagination={
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          }
        />
      </Card>

      {/* Detail Modal Component */}
      <Modal
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        title={`Chi tiết hoạt động Audit #${selectedAudit?.logId}`}
        size="md"
      >
        {selectedAudit && (
          <div className="space-y-4 text-left text-xs">
            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400">Tài khoản thực hiện:</span>
                <strong>{selectedAudit.username || 'Hệ thống'} ({selectedAudit.role || 'Admin/Manager'})</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400">Đối tượng liên quan:</span>
                <strong>{selectedAudit.fullName ? `${selectedAudit.fullName} (${selectedAudit.employeeCode})` : 'Hệ thống'}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400">Hành động:</span>
                <strong className="text-primary-650">{selectedAudit.action}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400">Mô tả chi tiết:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedAudit.description}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400">Địa chỉ IP:</span>
                <strong className="font-mono">{selectedAudit.ipAddress || '127.0.0.1'}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400">Trạng thái:</span>
                <strong className={`font-mono ${selectedAudit.status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedAudit.status}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-slate-400">Dấu vân tay thiết bị (Fingerprint):</span>
                <strong className="font-mono text-[10px] break-all">{selectedAudit.deviceFingerprint || '—'}</strong>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Thời gian tạo:</span>
                <strong>{dayjs(selectedAudit.actionTime).format('HH:mm:ss DD/MM/YYYY')}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setSelectedAudit(null)}>
                Đóng chi tiết
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
