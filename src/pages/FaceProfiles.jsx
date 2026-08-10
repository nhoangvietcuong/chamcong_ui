import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiSmile, FiTrash2, FiToggleLeft, FiToggleRight, 
  FiRefreshCw, FiSearch, FiLayers, FiAlertCircle 
} from 'react-icons/fi';
import dayjs from 'dayjs';
import Card from '../components/Card';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import SearchBox from '../components/SearchBox';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import useApp from '../hooks/useApp';
import usePagination from '../hooks/usePagination';
import faceProfileAdminService from '../services/faceProfileAdminService';

export const FaceProfiles = () => {
  const { toast, showLoading } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        keyword: keyword || undefined,
        status: statusFilter !== '' ? statusFilter : undefined
      };
      const res = await faceProfileAdminService.getFaceProfiles(params);
      if (res && res.success && res.data) {
        setProfiles(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách hồ sơ khuôn mặt');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, statusFilter, setTotal, toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSearch = (val) => {
    setKeyword(val);
    resetPagination();
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    resetPagination();
  };

  const handleToggleStatus = async (profile) => {
    showLoading(true);
    try {
      const newStatus = profile.status === 1 ? 0 : 1;
      const res = await faceProfileAdminService.updateStatus(profile.faceProfileId, newStatus);
      if (res && res.success) {
        toast.success(newStatus === 1 ? 'Đã kích hoạt hồ sơ khuôn mặt!' : 'Đã vô hiệu hóa hồ sơ khuôn mặt!');
        fetchProfiles();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thay đổi trạng thái hồ sơ');
    } finally {
      showLoading(false);
    }
  };

  const handleOpenDeleteDialog = (profileId) => {
    setSelectedProfileId(profileId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProfile = async () => {
    showLoading(true);
    try {
      const res = await faceProfileAdminService.deleteProfile(selectedProfileId);
      if (res && res.success) {
        toast.success('Xóa hồ sơ khuôn mặt thành công! Nhân viên có thể đăng ký lại.');
        setDeleteDialogOpen(false);
        fetchProfiles();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa hồ sơ khuôn mặt');
    } finally {
      showLoading(false);
    }
  };

  const headers = [
    { key: 'faceProfileId', label: 'ID', sortable: false, width: '80px' },
    { key: 'employee', label: 'Nhân viên', sortable: false },
    { key: 'embeddingVersion', label: 'Embedding Version', sortable: false },
    { key: 'provider', label: 'Model Version', sortable: false },
    { key: 'status', label: 'Trạng thái', sortable: false, width: '130px' },
    { key: 'registeredAt', label: 'Ngày đăng ký', sortable: false, width: '180px' },
    { key: 'actions', label: 'Hành động', sortable: false, width: '120px' },
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiSmile className="w-5 h-5 text-primary-600" />
            Quản lý hồ sơ nhận diện khuôn mặt
          </h1>
          <p className="text-xs text-slate-500">Giám sát các vector đặc trưng khuôn mặt (embeddings) đã đăng ký của nhân sự</p>
        </div>
        <button
          onClick={fetchProfiles}
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
              placeholder="Tìm mã, tên nhân viên..." 
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
          items={profiles}
          loading={loading}
          emptyState={
            <Card className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white dark:bg-slate-900 border-none">
              <FiLayers className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Không tìm thấy hồ sơ khuôn mặt nào</p>
              <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra bộ lọc</p>
            </Card>
          }
          renderRow={(p) => (
            <>
              <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                #{p.faceProfileId}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{p.employee?.fullName}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">{p.employee?.employeeCode} • {p.employee?.departmentName}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                {p.embeddingVersion}
              </td>
              <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                {p.provider}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.status === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                  {p.status === 1 ? 'Hoạt động' : 'Vô hiệu hóa'}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                {dayjs(p.registeredAt).format('HH:mm DD/MM/YYYY')}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(p)}
                    title={p.status === 1 ? 'Vô hiệu hóa hồ sơ' : 'Kích hoạt hồ sơ'}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all ${p.status === 1 ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/15' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/15'}`}
                  >
                    {p.status === 1 ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleOpenDeleteDialog(p.faceProfileId)}
                    title="Xóa hồ sơ (đăng ký lại)"
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
        onConfirm={handleDeleteProfile}
        title="Xác nhận xóa hồ sơ khuôn mặt"
        message="Bạn có chắc chắn muốn xóa hồ sơ khuôn mặt này không? Sau khi xóa, nhân viên này sẽ bắt buộc phải đăng ký lại khuôn mặt mới có thể check-in/check-out được."
        confirmLabel="Đồng ý xóa"
        cancelLabel="Quay lại"
      />
    </div>
  );
};

export default FaceProfiles;
