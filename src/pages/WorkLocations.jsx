import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FiMapPin, FiPlus, FiEdit2, FiLock, FiUnlock,
  FiTrash2, FiAlertTriangle, FiX, FiXCircle
} from 'react-icons/fi';
import LocationSearch from '../components/LocationSearch';
import { workLocationService } from '../services/workLocationService';
import settingService from '../services/settingService';
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
import { locationSchema } from '../validators/workLocationValidator';


export const WorkLocations = () => {
  const { toast, showLoading } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);

  // States
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [defaultRadius, setDefaultRadius] = useState(100);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);



  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(locationSchema),
  });

  const fetchLocations = useCallback(async () => {
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
      const res = await workLocationService.getWorkLocations(params);
      if (res && res.success && res.data) {
        setLocations(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách địa điểm');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, statusFilter, sortBy, sortOrder, setTotal, toast]);

  useEffect(() => {
    fetchLocations();
    settingService.getSettings().then(res => {
      if (res && res.success && res.data?.defaultAllowedRadius) {
        setDefaultRadius(Number(res.data.defaultAllowedRadius));
      }
    }).catch(() => {});
  }, [fetchLocations]);

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
    setEditingLoc(null);
    reset({
      locationName: '',
      address: '',
      latitude: '',
      longitude: '',
      allowedRadiusMeter: defaultRadius,
      isCompanyLocation: false,
    });
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (loc) => {
    setEditingLoc(loc);
    reset({
      locationName: loc.locationName,
      address: loc.address || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      allowedRadiusMeter: loc.allowedRadiusMeter,
      isCompanyLocation: !!loc.isCompanyLocation,
    });
    setFormModalOpen(true);
  };

  const onSubmit = async (data) => {
    showLoading(true);
    try {
      if (editingLoc) {
        const res = await workLocationService.updateWorkLocation(editingLoc.locationId, data);
        if (res && res.success) {
          toast.success('Cập nhật địa điểm thành công!');
          setFormModalOpen(false);
          fetchLocations();
        }
      } else {
        const res = await workLocationService.createWorkLocation(data);
        if (res && res.success) {
          toast.success('Thêm địa điểm thành công!');
          setFormModalOpen(false);
          fetchLocations();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu địa điểm');
    } finally {
      showLoading(false);
    }
  };

  const handleToggleStatus = async (loc) => {
    const newStatus = parseInt(loc.status, 10) === 1 ? 0 : 1;
    showLoading(true);
    try {
      const res = await workLocationService.updateWorkLocationStatus(loc.locationId, newStatus);
      if (res && res.success) {
        toast.success(newStatus === 1 ? 'Mở khóa địa điểm thành công' : 'Khóa địa điểm thành công');
        fetchLocations();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi đổi trạng thái địa điểm');
    } finally {
      showLoading(false);
    }
  };

  // Called when user picks a location from LocationSearch and clicks "Sử dụng tọa độ này"
  const handleLocationSelect = ({ address, latitude, longitude }) => {
    // Pre-fill form fields
    setValue('address', address);
    setValue('latitude', latitude);
    setValue('longitude', longitude);

    // Open create modal if not already open
    if (!formModalOpen) {
      setEditingLoc(null);
      reset({
        locationName: '',
        address,
        latitude,
        longitude,
        allowedRadiusMeter: defaultRadius,
        isCompanyLocation: false,
      });
      setFormModalOpen(true);
    }
  };

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [editConfirmModalOpen, setEditConfirmModalOpen] = useState(false);

  const [bulkRadius, setBulkRadius] = useState('');
  const [bulkType, setBulkType] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  const isAllSelected = locations.length > 0 && locations.every(l => selectedIds.includes(l.locationId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(locations.map(l => l.locationId));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulkEditModal = () => {
    if (selectedIds.length === 0) return;
    setBulkRadius('');
    setBulkType('');
    setBulkStatus('');
    setBulkEditModalOpen(true);
  };

  const handleBulkEditSubmit = (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    if (bulkRadius === '' && bulkType === '' && bulkStatus === '') {
      toast.error('Vui lòng nhập hoặc chọn thông tin mới để cập nhật');
      return;
    }
    
    setEditConfirmModalOpen(true);
  };

  const executeBulkEdit = async () => {
    showLoading(true);
    let successCount = 0;
    for (const locId of selectedIds) {
      try {
        const loc = locations.find(l => l.locationId === locId);
        if (loc) {
          if (bulkRadius !== '' || bulkType !== '') {
            const updatePayload = {
              locationName: loc.locationName,
              address: loc.address,
              latitude: loc.latitude,
              longitude: loc.longitude,
              allowedRadiusMeter: bulkRadius !== '' ? Number(bulkRadius) : loc.allowedRadiusMeter,
              isCompanyLocation: bulkType !== '' ? (bulkType === '1') : loc.isCompanyLocation
            };
            await workLocationService.updateWorkLocation(locId, updatePayload);
          }
          if (bulkStatus !== '') {
            await workLocationService.updateWorkLocationStatus(locId, Number(bulkStatus));
          }
          successCount++;
        }
      } catch (err) {
        console.error(`Error bulk updating location ${locId}:`, err);
      }
    }

    toast.success(`Cập nhật thành công thông tin cho ${successCount}/${selectedIds.length} địa điểm!`);
    setBulkEditModalOpen(false);
    setEditConfirmModalOpen(false);
    setSelectedIds([]);
    fetchLocations();
    showLoading(false);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteConfirmModalOpen(true);
  };

  const executeBulkDelete = async () => {
    showLoading(true);
    try {
      const res = await workLocationService.bulkDeleteWorkLocations(selectedIds);
      if (res && res.success) {
        toast.success(res.message || `Đã xóa thành công ${res.data?.count || selectedIds.length} địa điểm!`);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa địa điểm hàng loạt');
    } finally {
      setSelectedIds([]);
      setDeleteConfirmModalOpen(false);
      fetchLocations();
      showLoading(false);
    }
  };

  const headers = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
      sortable: false,
      width: '40px'
    },
    { key: 'locationName', label: 'Tên địa điểm', sortable: true },
    { key: 'address', label: 'Địa chỉ', sortable: false },
    { key: 'latitude', label: 'Vĩ độ (Lat)', sortable: false },
    { key: 'longitude', label: 'Kinh độ (Lng)', sortable: false },
    { key: 'allowedRadiusMeter', label: 'Bán kính geofence', sortable: true },
    { key: 'isCompanyLocation', label: 'Loại địa điểm', sortable: false },
    { key: 'status', label: 'Trạng thái', sortable: true },
    { key: 'actions', label: 'Hành động', sortable: false, width: '150px' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiMapPin className="w-5 h-5 text-primary-600" />
            Quản lý địa điểm chấm công
          </h1>
          <p className="text-xs text-slate-500">Thiết lập tọa độ địa lý GPS và bán kính kiểm soát (geofence) cho các công trình, dự án</p>
        </div>
        {/* GPS Finder + Add button row */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          {/* Khu vực tìm tọa độ */}
          <div className="flex-1 max-w-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔍 Nhập tên hoặc địa chỉ, hệ thống sẽ tự động lấy tọa độ.
            </label>

            <LocationSearch onSelectLocation={handleLocationSelect} />
          </div>

          {/* Nút thêm địa điểm */}
          <div className="flex justify-end shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<FiPlus />}
              onClick={handleOpenCreateModal}
            >
              Thêm địa điểm
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 items-start">
        {/* Table list */}
        <div>
          <Card className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SearchBox value={keyword} onChange={handleSearch} placeholder="Tìm theo tên, địa chỉ..." />
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

            <Table
              headers={headers}
              items={locations}
              loading={loading}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              renderRow={(loc) => (
                <>
                  <td className="px-3 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(loc.locationId)}
                      onChange={() => toggleSelectRow(loc.locationId)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                    {loc.locationName}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-[150px] truncate" title={loc.address}>
                    {loc.address || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-700 dark:text-slate-350">
                    {parseFloat(loc.latitude).toFixed(6)}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-700 dark:text-slate-350">
                    {parseFloat(loc.longitude).toFixed(6)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {loc.allowedRadiusMeter} m
                  </td>
                  <td className="px-6 py-4">
                    {loc.isCompanyLocation ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40">
                        🏢 Company
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 shadow-sm dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
                        📍 Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge type="activeStatus" value={loc.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(loc)}
                        title="Chỉnh sửa"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/15 transition-all"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(loc)}
                        title={parseInt(loc.status, 10) === 1 ? 'Khóa địa điểm' : 'Mở khóa địa điểm'}
                        className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 transition-all ${parseInt(loc.status, 10) === 1
                          ? 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10'
                          : 'hover:text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/10'
                          }`}
                      >
                        {parseInt(loc.status, 10) === 1 ? <FiLock className="w-3.5 h-3.5" /> : <FiUnlock className="w-3.5 h-3.5" />}
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
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingLoc ? 'Cập nhật địa điểm' : 'Tạo mới địa điểm'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tên địa điểm / Dự án"
            name="locationName"
            placeholder="Văn phòng Quận 1, Dự án A..."
            error={errors.locationName}
            {...register('locationName')}
          />
          <Input
            label="Địa chỉ chi tiết"
            name="address"
            placeholder="Nhập địa chỉ..."
            error={errors.address}
            {...register('address')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vĩ độ (Latitude)"
              name="latitude"
              type="number"
              step="any"
              placeholder="Ví dụ: 10.762622..."
              error={errors.latitude}
              {...register('latitude')}
            />
            <Input
              label="Kinh độ (Longitude)"
              name="longitude"
              type="number"
              step="any"
              placeholder="Ví dụ: 106.660172..."
              error={errors.longitude}
              {...register('longitude')}
            />
          </div>
          <Input
            label="Bán kính kiểm soát (mét)"
            name="allowedRadiusMeter"
            type="number"
            placeholder="Ví dụ: 100, 200..."
            error={errors.allowedRadiusMeter}
            {...register('allowedRadiusMeter')}
          />

          <div className="flex items-start gap-2 pt-1 pb-2">
            <div className="flex items-center h-5">
              <input
                id="isCompanyLocation"
                name="isCompanyLocation"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                {...register('isCompanyLocation')}
              />
            </div>
            <div className="text-sm leading-5">
              <label htmlFor="isCompanyLocation" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1">
                Đây là Văn phòng công ty
              </label>
              <p className="text-slate-400 text-xs mt-0.5">
                Nhân viên luôn được phép Check-in tại địa điểm này kể cả khi được phân công ở địa điểm khác.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setFormModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Lưu địa điểm
            </Button>
          </div>
        </form>
      </Modal>
      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 dark:bg-slate-800/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-r border-slate-700 pr-4">
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[11px] font-bold">
              {selectedIds.length}
            </span>
            <span>Đã chọn {selectedIds.length} địa điểm</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenBulkEditModal}
              className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FiEdit2 className="w-4 h-4" />
              Sửa hàng loạt
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FiTrash2 className="w-4 h-4" />
              Xóa địa điểm
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Hủy chọn"
            >
              <FiXCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Redesigned Delete Confirmation Modal */}
      {deleteConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-[500px] overflow-hidden transform transition-all scale-100 animate-slide-up flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h3 className="text-[17px] font-extrabold text-slate-800">
                Xóa {selectedIds.length} địa điểm đã chọn
              </h3>
              <button onClick={() => setDeleteConfirmModalOpen(false)} className="text-slate-500 hover:text-slate-800 transition-colors">
                <FiX className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            
            <div className="px-8 pt-8 pb-10 text-center flex flex-col items-center">
              <div className="w-[60px] h-[60px] bg-rose-50 rounded-full flex items-center justify-center mb-6">
                <FiAlertTriangle className="w-[26px] h-[26px] text-rose-600 stroke-2" />
              </div>
              
              <p className="text-[15.5px] text-slate-600 leading-[1.6] font-medium px-2">
                CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn {selectedIds.length} địa điểm được chọn không? Những địa điểm đã phát sinh dữ liệu chấm công hoặc phân ca thực tế sẽ không thể bị xóa.
              </p>
            </div>

            <div className="px-8 pb-8 pt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmModalOpen(false)}
                className="flex-1 py-[14px] rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-[15px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeBulkDelete}
                className="flex-1 py-[14px] rounded-xl font-bold text-white bg-[#ef003d] hover:bg-rose-700 transition-colors text-[15px]"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Modal */}
      {editConfirmModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-[500px] overflow-hidden transform transition-all scale-100 animate-slide-up flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h3 className="text-[17px] font-extrabold text-slate-800">
                Sửa {selectedIds.length} địa điểm đã chọn
              </h3>
              <button onClick={() => setEditConfirmModalOpen(false)} className="text-slate-500 hover:text-slate-800 transition-colors">
                <FiX className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            
            <div className="px-8 pt-8 pb-10 text-center flex flex-col items-center">
              <div className="w-[60px] h-[60px] bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <FiAlertTriangle className="w-[26px] h-[26px] text-amber-500 stroke-2" />
              </div>
              
              <p className="text-[15.5px] text-slate-600 leading-[1.6] font-medium px-2">
                CẢNH BÁO: Việc chỉnh sửa hàng loạt sẽ áp dụng ngay lập tức cho {selectedIds.length} địa điểm đã chọn. Bạn có CHẮC CHẮN muốn tiếp tục không?
              </p>
            </div>

            <div className="px-8 pb-8 pt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setEditConfirmModalOpen(false)}
                className="flex-1 py-[14px] rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-[15px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeBulkEdit}
                className="flex-1 py-[14px] rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors text-[15px]"
              >
                Đồng ý thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bulk Edit Locations */}
      {bulkEditModalOpen && (
        <Modal
          isOpen={bulkEditModalOpen}
          onClose={() => setBulkEditModalOpen(false)}
          title={`Sửa hàng loạt ${selectedIds.length} địa điểm`}
        >
          <form onSubmit={handleBulkEditSubmit} className="space-y-4 text-left">
            <Input
              label="Bán kính geofence mới (m) (Tùy chọn):"
              name="bulkRadius"
              type="number"
              placeholder="Giữ nguyên nếu để trống"
              value={bulkRadius}
              onChange={(e) => setBulkRadius(e.target.value)}
            />
            <Select
              label="Loại địa điểm mới (Tùy chọn):"
              name="bulkType"
              value={bulkType}
              onChange={(e) => setBulkType(e.target.value)}
              options={[
                { value: '1', label: 'Văn phòng công ty (Được check-in mọi lúc)' },
                { value: '0', label: 'Địa điểm bình thường (Theo phân ca)' }
              ]}
              placeholder="-- Giữ nguyên loại địa điểm --"
            />
            <Select
              label="Trạng thái hoạt động (Tùy chọn):"
              name="bulkStatus"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              options={[
                { value: '1', label: 'Đang hoạt động' },
                { value: '0', label: 'Đang khóa' }
              ]}
              placeholder="-- Giữ nguyên trạng thái --"
            />
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setBulkEditModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary">
                Tiếp tục
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default WorkLocations;
