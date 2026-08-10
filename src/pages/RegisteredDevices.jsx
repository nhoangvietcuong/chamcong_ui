import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiMonitor, FiTrash2, FiToggleLeft, FiToggleRight, 
  FiRefreshCw, FiSearch, FiLayers, FiClock 
} from 'react-icons/fi';
import dayjs from 'dayjs';
import Card from '../components/Card';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import SearchBox from '../components/SearchBox';
import Select from '../components/Select';
import ConfirmDialog from '../components/ConfirmDialog';
import useApp from '../hooks/useApp';
import usePagination from '../hooks/usePagination';
import deviceAdminService from '../services/deviceAdminService';

export const RegisteredDevices = () => {
  const { toast, showLoading } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        keyword: keyword || undefined,
        status: statusFilter !== '' ? statusFilter : undefined
      };
      const res = await deviceAdminService.getDevices(params);
      if (res && res.success && res.data) {
        setDevices(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, statusFilter, setTotal, toast]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleSearch = (val) => {
    setKeyword(val);
    resetPagination();
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    resetPagination();
  };

  const handleToggleStatus = async (dev) => {
    showLoading(true);
    try {
      const newStatus = dev.status === 1 ? 0 : 1;
      const res = await deviceAdminService.updateStatus(dev.deviceId, newStatus);
      if (res && res.success) {
        toast.success(newStatus === 1 ? 'Đã kích hoạt quyền hoạt động của thiết bị!' : 'Đã tạm khóa thiết bị!');
        fetchDevices();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thay đổi trạng thái thiết bị');
    } finally {
      showLoading(false);
    }
  };

  const handleOpenDeleteDialog = (sessionId) => {
    setSelectedSessionId(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDevice = async () => {
    showLoading(true);
    try {
      const res = await deviceAdminService.revokeDevice(selectedSessionId);
      if (res && res.success) {
        toast.success('Thu hồi thiết bị thành công! Session của thiết bị này đã bị hủy bỏ.');
        setDeleteDialogOpen(false);
        fetchDevices();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thu hồi thiết bị');
    } finally {
      showLoading(false);
    }
  };

  const headers = [
    { key: 'employee', label: 'Nhân viên', sortable: false },
    { key: 'deviceName', label: 'Thiết bị & OS', sortable: false },
    { key: 'browser', label: 'Trình duyệt', sortable: false },
    { key: 'fingerprint', label: 'Fingerprint', sortable: false },
    { key: 'lastLogin', label: 'Hoạt động cuối', sortable: false, width: '180px' },
    { key: 'status', label: 'Trạng thái', sortable: false, width: '120px' },
    { key: 'actions', label: 'Hành động', sortable: false, width: '120px' },
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiMonitor className="w-5 h-5 text-primary-600" />
            Quản lý thiết bị đã đăng ký
          </h1>
          <p className="text-xs text-slate-500">Giám sát danh sách các thiết bị di động và trình duyệt PWA được cấp quyền chấm công</p>
        </div>
        <button
          onClick={fetchDevices}
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
              placeholder="Tìm mã, tên nhân viên, OS, trình duyệt, vân tay thiết bị..." 
            />
          </div>
          <Select
            name="status"
            value={statusFilter}
            onChange={handleStatusFilter}
            options={[
              { value: '1', label: 'Hoạt động (Active)' },
              { value: '0', label: 'Đã khóa/Đăng xuất (Revoked)' }
            ]}
            placeholder="Tất cả trạng thái"
          />
        </div>
      </Card>

      {/* Table Section */}
      <Card className="flex flex-col gap-5">
        <Table
          headers={headers}
          items={devices}
          loading={loading}
          emptyState={
            <Card className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white dark:bg-slate-900 border-none">
              <FiLayers className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Không tìm thấy thiết bị nào</p>
              <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra bộ lọc</p>
            </Card>
          }
          renderRow={(dev) => (
            <>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{dev.employee?.fullName}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">{dev.employee?.employeeCode} • {dev.employee?.departmentName}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="font-semibold text-slate-850 dark:text-slate-200 block">{dev.deviceName}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{dev.operatingSystem} • {dev.platform}</span>
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                {dev.browser}
              </td>
              <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                <span className="truncate max-w-[120px] block" title={dev.fingerprint}>{dev.fingerprint}</span>
              </td>
              <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                {dev.lastLogin ? dayjs(dev.lastLogin).format('HH:mm DD/MM/YYYY') : '—'}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${dev.status === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                  {dev.status === 1 ? 'Hoạt động' : 'Đã khóa/Đăng xuất'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(dev)}
                    title={dev.status === 1 ? 'Khóa thiết bị từ xa' : 'Mở khóa thiết bị'}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all ${dev.status === 1 ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/15' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/15'}`}
                  >
                    {dev.status === 1 ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleOpenDeleteDialog(dev.deviceId)}
                    title="Thu hồi quyền thiết bị (xóa session)"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-all"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDevice}
        title="Xác nhận thu hồi thiết bị"
        message="Bạn có chắc chắn muốn thu hồi thiết bị này không? Sau khi thu hồi, nhân viên đang đăng nhập trên thiết bị này sẽ bị đăng xuất ngay lập tức."
        confirmLabel="Đồng ý thu hồi"
        cancelLabel="Quay lại"
      />
    </div>
  );
};

export default RegisteredDevices;
