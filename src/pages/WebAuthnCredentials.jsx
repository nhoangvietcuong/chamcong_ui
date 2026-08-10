import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiKey, FiTrash2, FiToggleLeft, FiToggleRight, 
  FiRefreshCw, FiSearch, FiLayers, FiCpu 
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
import webauthnAdminService from '../services/webauthnAdminService';

export const WebAuthnCredentials = () => {
  const { toast, showLoading } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCredentialId, setSelectedCredentialId] = useState(null);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        keyword: keyword || undefined,
        status: statusFilter !== '' ? statusFilter : undefined
      };
      const res = await webauthnAdminService.getCredentials(params);
      if (res && res.success && res.data) {
        setCredentials(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách khóa bảo mật');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, statusFilter, setTotal, toast]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSearch = (val) => {
    setKeyword(val);
    resetPagination();
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    resetPagination();
  };

  const handleToggleStatus = async (cred) => {
    showLoading(true);
    try {
      const newStatus = cred.status === 1 ? 0 : 1;
      const res = await webauthnAdminService.updateStatus(cred.credentialId, newStatus);
      if (res && res.success) {
        toast.success(newStatus === 1 ? 'Đã kích hoạt khóa WebAuthn!' : 'Đã tạm vô hiệu hóa khóa WebAuthn!');
        fetchCredentials();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thay đổi trạng thái khóa');
    } finally {
      showLoading(false);
    }
  };

  const handleOpenDeleteDialog = (credId) => {
    setSelectedCredentialId(credId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCredential = async () => {
    showLoading(true);
    try {
      const res = await webauthnAdminService.deleteCredential(selectedCredentialId);
      if (res && res.success) {
        toast.success('Thu hồi khóa bảo mật thành công! Nhân viên này sẽ không thể dùng khóa này để đăng nhập/chấm công nữa.');
        setDeleteDialogOpen(false);
        fetchCredentials();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thu hồi khóa bảo mật');
    } finally {
      showLoading(false);
    }
  };

  const headers = [
    { key: 'employee', label: 'Nhân viên', sortable: false },
    { key: 'credentialName', label: 'Tên thiết bị (Key)', sortable: false },
    { key: 'authenticator', label: 'Authenticator', sortable: false },
    { key: 'residentKey', label: 'Resident Key', sortable: false, width: '120px' },
    { key: 'lastUsedAt', label: 'Lần dùng cuối', sortable: false, width: '180px' },
    { key: 'status', label: 'Trạng thái', sortable: false, width: '120px' },
    { key: 'actions', label: 'Hành động', sortable: false, width: '120px' },
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiKey className="w-5 h-5 text-primary-600" />
            Quản lý khóa bảo mật WebAuthn
          </h1>
          <p className="text-xs text-slate-500">Giám sát các khóa phần cứng bảo mật sinh trắc học và mã PIN (FIDO2 / WebAuthn) của nhân sự</p>
        </div>
        <button
          onClick={fetchCredentials}
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
              placeholder="Tìm mã, tên nhân viên, tên thiết bị..." 
            />
          </div>
          <Select
            name="status"
            value={statusFilter}
            onChange={handleStatusFilter}
            options={[
              { value: '1', label: 'Hoạt động (Active)' },
              { value: '0', label: 'Vô hiệu hóa (Inactive)' }
            ]}
            placeholder="Tất cả trạng thái"
          />
        </div>
      </Card>

      {/* Table Section */}
      <Card className="flex flex-col gap-5">
        <Table
          headers={headers}
          items={credentials}
          loading={loading}
          emptyState={
            <Card className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white dark:bg-slate-900 border-none">
              <FiLayers className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Không tìm thấy khóa bảo mật nào</p>
              <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra bộ lọc</p>
            </Card>
          }
          renderRow={(c) => (
            <>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{c.employee?.fullName}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">{c.employee?.employeeCode} • {c.employee?.departmentName}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="font-semibold text-slate-850 dark:text-slate-200">{c.credentialName}</span>
                <span className="block text-[9px] font-mono text-slate-400 truncate max-w-[150px] mt-0.5">{c.credentialId}</span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <FiCpu className="text-slate-400 shrink-0" />
                  <span>{c.authenticator}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-450">
                {c.residentKey}
              </td>
              <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                {c.lastUsedAt ? dayjs(c.lastUsedAt).format('HH:mm DD/MM/YYYY') : '—'}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.status === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                  {c.status === 1 ? 'Hoạt động' : 'Vô hiệu hóa'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(c)}
                    title={c.status === 1 ? 'Tạm vô hiệu hóa' : 'Kích hoạt khóa'}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all ${c.status === 1 ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/15' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/15'}`}
                  >
                    {c.status === 1 ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleOpenDeleteDialog(c.credentialId)}
                    title="Thu hồi khóa (xóa vĩnh viễn)"
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
        onConfirm={handleDeleteCredential}
        title="Xác nhận thu hồi khóa bảo mật"
        message="Bạn có chắc chắn muốn thu hồi (xóa vĩnh viễn) khóa bảo mật này không? Nhân viên sở hữu sẽ không thể đăng nhập hoặc xác thực sinh trắc học bằng thiết bị này được nữa."
        confirmLabel="Đồng ý thu hồi"
        cancelLabel="Quay lại"
      />
    </div>
  );
};

export default WebAuthnCredentials;
