import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  FiBriefcase, FiPlus, FiEdit2, FiLock, FiUnlock, 
  FiSearch, FiInfo 
} from 'react-icons/fi';
import { departmentService } from '../services/departmentService';
import useApp from '../hooks/useApp';
import usePagination from '../hooks/usePagination';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import SearchBox from '../components/SearchBox';
import Select from '../components/Select';
import Input from '../components/Input';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import dayjs from 'dayjs';
import { departmentSchema } from '../validators/departmentValidator';


export const Departments = () => {
  const { toast, showLoading } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);
  
  // Table filters & states
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(departmentSchema),
  });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        keyword: keyword || undefined,
        status: statusFilter !== '' ? parseInt(statusFilter, 10) : undefined,
        sortBy,
        sortOrder,
      };
      const res = await departmentService.getDepartments(params);
      if (res && res.success && res.data) {
        setDepartments(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, statusFilter, sortBy, sortOrder, setTotal, toast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSearch = (val) => {
    setKeyword(val);
    resetPagination();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    resetPagination();
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    resetPagination();
  };

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    reset({ departmentName: '', description: '' });
    setModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setValue('departmentName', dept.department_name);
    setValue('description', dept.description || '');
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    showLoading(true);
    try {
      if (editingDept) {
        const res = await departmentService.updateDepartment(editingDept.department_id, data);
        if (res && res.success) {
          toast.success('Cập nhật phòng ban thành công!');
          setModalOpen(false);
          fetchDepartments();
        }
      } else {
        const res = await departmentService.createDepartment(data);
        if (res && res.success) {
          toast.success('Thêm phòng ban thành công!');
          setModalOpen(false);
          fetchDepartments();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu thông tin');
    } finally {
      showLoading(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    const newStatus = parseInt(dept.status, 10) === 1 ? 0 : 1;
    showLoading(true);
    try {
      const res = await departmentService.updateDepartmentStatus(dept.department_id, newStatus);
      if (res && res.success) {
        toast.success(newStatus === 1 ? 'Mở khóa phòng ban thành công' : 'Khóa phòng ban thành công');
        fetchDepartments();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thay đổi trạng thái');
    } finally {
      showLoading(false);
    }
  };



  const headers = [
    { key: 'department_id', label: 'ID', sortable: true },
    { key: 'department_name', label: 'Tên phòng ban', sortable: true },
    { key: 'description', label: 'Mô tả', sortable: false },
    { key: 'status', label: 'Trạng thái', sortable: true },
    { key: 'created_at', label: 'Ngày tạo', sortable: true },
    { key: 'actions', label: 'Hành động', sortable: false, width: '120px' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiBriefcase className="w-5 h-5 text-primary-600" />
            Quản lý phòng ban
          </h1>
          <p className="text-xs text-slate-500">Xem và cấu hình sơ đồ cơ cấu tổ chức phòng ban doanh nghiệp</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button variant="primary" size="sm" icon={<FiPlus />} onClick={handleOpenCreateModal}>
            Thêm phòng ban
          </Button>
        </div>
      </div>

      {/* Filter and Table Card */}
      <Card className="flex flex-col gap-5">
        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SearchBox value={keyword} onChange={handleSearch} placeholder="Tìm theo tên phòng ban..." />
          <Select 
            name="status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            options={[
              { value: '1', label: 'Đang hoạt động' },
              { value: '0', label: 'Đang khóa' }
            ]}
            placeholder="Tất cả trạng thái"
          />
        </div>

        {/* Generic Table */}
        <Table
          headers={headers}
          items={departments}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          renderRow={(dept) => (
            <>
              <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                {dept.department_id}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                {dept.department_name}
              </td>
              <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                {dept.description || '—'}
              </td>
              <td className="px-6 py-4">
                <StatusBadge type="activeStatus" value={dept.status} />
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">
                {dayjs(dept.created_at).format('DD/MM/YYYY HH:mm')}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(dept)}
                    title="Chỉnh sửa"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/15 transition-all"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(dept)}
                    title={parseInt(dept.status, 10) === 1 ? 'Khóa phòng ban' : 'Mở khóa phòng ban'}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 transition-all ${
                      parseInt(dept.status, 10) === 1 
                        ? 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10' 
                        : 'hover:text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/10'
                    }`}
                  >
                    {parseInt(dept.status, 10) === 1 ? <FiLock className="w-3.5 h-3.5" /> : <FiUnlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
            </>
          )}
          pagination={
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
            />
          }
        />
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? 'Cập nhật phòng ban' : 'Tạo mới phòng ban'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tên phòng ban"
            name="departmentName"
            placeholder="Nhập tên phòng ban..."
            error={errors.departmentName}
            {...register('departmentName')}
          />
          <Input
            label="Mô tả phòng ban"
            name="description"
            placeholder="Nhập mô tả chi tiết về phòng ban này..."
            error={errors.description}
            {...register('description')}
          />

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Lưu thông tin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Departments;
