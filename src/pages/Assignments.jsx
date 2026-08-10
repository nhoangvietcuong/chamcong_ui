import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MultiSelect } from '../components/MultiSelect';
import {
  FiCalendar, FiPlus, FiEdit2, FiXCircle, FiSearch,
  FiUser, FiMapPin, FiInfo, FiLayers, FiAlertTriangle,
  FiChevronLeft, FiChevronRight, FiCopy, FiTrash2, FiRefreshCw, FiX
} from 'react-icons/fi';
import { assignmentService } from '../services/assignmentService';
import { departmentService } from '../services/departmentService';
import { shiftService } from '../services/shiftService';
import { employeeService } from '../services/employeeService';
import { workLocationService } from '../services/workLocationService';
import api from '../services/api';
import useApp from '../hooks/useApp';
import usePagination from '../hooks/usePagination';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import SearchBox from '../components/SearchBox';
import Select from '../components/Select';
import Input from '../components/Input';
import DatePicker from '../components/DatePicker';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import MissingApiAlert from '../components/MissingApiAlert';
import dayjs from 'dayjs';
import { assignmentSchema } from '../validators/assignmentValidator';

export const Assignments = () => {
  const { toast, showLoading } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);

  // States
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list or calendar

  // Calendar States
  const [calendarYear, setCalendarYear] = useState(dayjs().year());
  const [calendarMonth, setCalendarMonth] = useState(dayjs().month() + 1); // 1-indexed
  const [calendarDays, setCalendarDays] = useState({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('workDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editingAssign, setEditingAssign] = useState(null);
  const [selectedAssignId, setSelectedAssignId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Bulk Modal States
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState('create'); // 'create', 'copy', 'update', 'delete'
  const [bulkResult, setBulkResult] = useState(null);
  
  // Bulk Create States
  const [bulkSelectedEmployees, setBulkSelectedEmployees] = useState([]);
  const [bulkLocationIds, setBulkLocationIds] = useState([]);
  const [bulkShiftId, setBulkShiftId] = useState('');
  const [bulkStartDate, setBulkStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [bulkEndDate, setBulkEndDate] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [bulkRecurrenceType, setBulkRecurrenceType] = useState('NONE'); // NONE, WEEKLY, MONTHLY
  const [bulkRecurrenceDays, setBulkRecurrenceDays] = useState([]); // [0,1,2,3,4,5,6] (Sun-Sat)
  const [bulkNote, setBulkNote] = useState('');
  const [bulkDeptFilter, setBulkDeptFilter] = useState('');
  const [bulkEmpSearch, setBulkEmpSearch] = useState('');

  // Bulk Copy States
  const [copySourceDate, setCopySourceDate] = useState(dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')); // Monday this week
  const [copyTargetDate, setCopyTargetDate] = useState(dayjs().startOf('week').add(8, 'day').format('YYYY-MM-DD')); // Next Monday

  // Bulk Update Location States
  const [updateSourceLoc, setUpdateSourceLoc] = useState('');
  const [updateTargetLocs, setUpdateTargetLocs] = useState([]);
  const [updateStartDate, setUpdateStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [updateEndDate, setUpdateEndDate] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [updateSelectedEmployees, setUpdateSelectedEmployees] = useState([]); // optional
  const [updateDeptFilter, setUpdateDeptFilter] = useState('');
  const [updateEmpSearch, setUpdateEmpSearch] = useState('');

  // Bulk Delete States
  const [deleteStartDate, setDeleteStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [deleteEndDate, setDeleteEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [deleteLocationId, setDeleteLocationId] = useState('');
  const [deleteSelectedEmployees, setDeleteSelectedEmployees] = useState([]); // optional
  const [deleteDeptFilter, setDeleteDeptFilter] = useState('');
  const [deleteEmpSearch, setDeleteEmpSearch] = useState('');
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Selected Row Bulk Edit & Delete States
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditLocationIds, setBulkEditLocationIds] = useState([]);
  const [bulkEditAddLocationIds, setBulkEditAddLocationIds] = useState([]);
  const [bulkEditRemoveLocationIds, setBulkEditRemoveLocationIds] = useState([]);
  const [bulkEditCurrentLocationIds, setBulkEditCurrentLocationIds] = useState([]);
  const [bulkEditShiftId, setBulkEditShiftId] = useState('');
  const [bulkEditNote, setBulkEditNote] = useState('');
  const [bulkEditMode, setBulkEditMode] = useState('CUSTOM'); // 'CUSTOM' or 'REPLACE'
  const [selectedDeleteConfirmOpen, setSelectedDeleteConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(assignmentSchema),
  });

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        keyword: keyword || undefined,
        employeeId: empFilter || undefined,
        locationId: locFilter || undefined,
        departmentId: deptFilter || undefined,
        workDate: dateFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      };
      const res = await assignmentService.getAssignments(params);
      if (res && res.success && res.data) {
        setAssignments(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách phân công');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, empFilter, locFilter, deptFilter, dateFilter, statusFilter, sortBy, sortOrder, setTotal, toast]);

  const fetchCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const params = {
        year: calendarYear,
        month: calendarMonth,
        departmentId: deptFilter || undefined,
        locationId: locFilter || undefined,
      };
      const res = await assignmentService.getCalendar(params);
      if (res && res.success && res.data) {
        setCalendarDays(res.data.days || {});
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải lịch biểu phân công');
    } finally {
      setCalendarLoading(false);
    }
  }, [calendarYear, calendarMonth, deptFilter, locFilter, toast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchCalendar();
    }
  }, [viewMode, fetchCalendar]);

  useEffect(() => {
    // Fetch dropdown data
    employeeService.getEmployees({ limit: 100, status: 1 }).then(res => {
      if (res && res.success) setEmployees(res.data.items || []);
    }).catch(console.error);

    workLocationService.getWorkLocations({ limit: 100, status: 1 }).then(res => {
      if (res && res.success) setLocations(res.data.items || []);
    }).catch(console.error);

    departmentService.getDepartments({ limit: 100, status: 1 }).then(res => {
      if (res && res.success) setDepartments(res.data.items || []);
    }).catch(console.error);

    shiftService.getShifts({ limit: 100 }).then(res => {
      if (res && res.success) {
        setShifts(res.data.items || []);
      }
    }).catch(console.error);
  }, []);

  const handleSearch = (val) => {
    setKeyword(val);
    resetPagination();
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    resetPagination();
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    resetPagination();
  };

  const handleOpenCreateModal = () => {
    setEditingAssign(null);
    reset({
      employeeId: '',
      locationIds: [],
      shiftId: '',
      workDate: dayjs().format('YYYY-MM-DD'),
      note: '',
    });
    setFormModalOpen(true);
  };

  const handleOpenCreateModalForDate = (dateStr) => {
    setEditingAssign(null);
    reset({
      employeeId: '',
      locationIds: [],
      shiftId: '',
      workDate: dateStr,
      note: '',
    });
    setFormModalOpen(true);
  };

  const handleEditFromCalendar = async (assignmentId) => {
    showLoading(true);
    try {
      const res = await assignmentService.getAssignmentById(assignmentId);
      if (res && res.success && res.data) {
        setSelectedDayDetails(null);
        handleOpenEditModal(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải chi tiết phân công');
    } finally {
      showLoading(false);
    }
  };

  const handleCancelFromCalendar = (assignmentId) => {
    setSelectedDayDetails(null);
    handleOpenCancelDialog(assignmentId);
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setCalendarYear(dayjs().year());
    setCalendarMonth(dayjs().month() + 1);
  };

  const handleOpenEditModal = (assign) => {
    setEditingAssign(assign);
    const allowedLocIds = assign.allowedLocations && assign.allowedLocations.length > 0
      ? assign.allowedLocations.map(loc => loc.locationId)
      : [assign.location?.locationId ?? assign.locationId];

    reset({
      employeeId: assign.employee?.employeeId ?? assign.employeeId,
      locationIds: allowedLocIds,
      shiftId: assign.shift?.shiftId ?? assign.shiftId ?? '',
      workDate: dayjs(assign.workDate).format('YYYY-MM-DD'),
      note: assign.note || '',
    });
    setFormModalOpen(true);
  };

  const handleOpenCancelDialog = (id) => {
  setSelectedAssignId(id);
  setCancelReason('');
  setCancelDialogOpen(true);
};

  const onSubmit = async (data) => {
    showLoading(true);
    try {
      if (editingAssign) {
        // Edit assignment
        const res = await assignmentService.updateAssignment(editingAssign.assignmentId, {
          employeeId: editingAssign.employee?.employeeId ?? editingAssign.employeeId,
          locationIds: data.locationIds,
          shiftId: data.shiftId,
          workDate: data.workDate,
          note: data.note || null,
        });
        if (res && res.success) {
          toast.success('Cập nhật phân công thành công!');
          setFormModalOpen(false);
          fetchAssignments();
          if (viewMode === 'calendar') fetchCalendar();
        }
      } else {
        // Add new assignment
        const res = await assignmentService.createAssignment({
          employeeId: data.employeeId,
          locationIds: data.locationIds,
          shiftId: data.shiftId,
          workDate: data.workDate,
          note: data.note || null,
        });
        if (res && res.success) {
          toast.success('Tạo phân công thành công!');
          setFormModalOpen(false);
          fetchAssignments();
          if (viewMode === 'calendar') fetchCalendar();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu thông tin phân công');
    } finally {
      showLoading(false);
    }
  };

 const handleCancelAssignment = async () => {
  if (!cancelReason.trim()) {
    toast.error('Vui lòng nhập lý do hủy phân công');
    return;
  }

  showLoading(true);

  try {
    const res = await assignmentService.cancelAssignment(
      selectedAssignId,
      {
        reason: cancelReason,
      }
    );

    if (res && res.success) {
      toast.success('Hủy phân công làm việc thành công!');
      setCancelDialogOpen(false);
      setCancelReason('');
      fetchAssignments();
      if (viewMode === 'calendar') fetchCalendar();
    }
  } catch (err) {
    toast.error(err.message || 'Lỗi hủy phân công');
  } finally {
    showLoading(false);
  }
};

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    if (bulkSelectedEmployees.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhân viên');
      return;
    }
    if (!bulkLocationIds || bulkLocationIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một địa điểm');
      return;
    }
    if (!bulkStartDate || !bulkEndDate) {
      toast.error('Vui lòng nhập khoảng ngày làm việc');
      return;
    }
    if (dayjs(bulkStartDate).isAfter(dayjs(bulkEndDate))) {
      toast.error('Ngày bắt đầu không được sau ngày kết thúc');
      return;
    }
    if (bulkRecurrenceType === 'WEEKLY' && (!bulkRecurrenceDays || bulkRecurrenceDays.length === 0)) {
      toast.error('Vui lòng chọn ít nhất một thứ trong tuần để lặp');
      return;
    }
    if (bulkRecurrenceType === 'MONTHLY' && (!bulkRecurrenceDays || bulkRecurrenceDays.length === 0)) {
      toast.error('Vui lòng chọn ít nhất một ngày trong tháng để lặp');
      return;
    }

    showLoading(true);
    try {
      const payload = {
        employeeIds: bulkSelectedEmployees.map(Number),
        locationIds: bulkLocationIds.map(Number),
        shiftId: bulkShiftId ? Number(bulkShiftId) : undefined,
        startDate: bulkStartDate,
        endDate: bulkEndDate,
        recurrenceType: bulkRecurrenceType,
        recurrenceDays: bulkRecurrenceType !== 'NONE' ? bulkRecurrenceDays.map(Number) : undefined,
        note: bulkNote || undefined
      };
      
      const res = await assignmentService.createBulkAssignments(payload);
      if (res && res.success) {
        toast.success('Phân công hàng loạt thành công!');
        setBulkResult(res.data);
        fetchAssignments();
        if (viewMode === 'calendar') fetchCalendar();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi phân công hàng loạt');
    } finally {
      showLoading(false);
    }
  };

  const handleBulkCopy = async (e) => {
    e.preventDefault();
    if (!copySourceDate || !copyTargetDate) {
      toast.error('Vui lòng nhập ngày bắt đầu tuần nguồn và đích');
      return;
    }

    const sourceEndDate = dayjs(copySourceDate).add(6, 'day').format('YYYY-MM-DD');

    showLoading(true);
    try {
      const payload = {
        sourceStartDate: copySourceDate,
        sourceEndDate: sourceEndDate,
        targetStartDate: copyTargetDate
      };
      
      const res = await assignmentService.copyAssignments(payload);
      if (res && res.success) {
        toast.success('Sao chép phân công thành công!');
        setBulkResult(res.data);
        fetchAssignments();
        if (viewMode === 'calendar') fetchCalendar();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi sao chép phân công');
    } finally {
      showLoading(false);
    }
  };

  const handleBulkUpdateLocation = async (e) => {
    e.preventDefault();
    if (!updateSourceLoc || !updateTargetLocs || updateTargetLocs.length === 0) {
      toast.error('Vui lòng chọn đầy đủ địa điểm nguồn và đích');
      return;
    }
    if (updateTargetLocs.map(Number).includes(Number(updateSourceLoc))) {
      toast.error('Địa điểm đích không được trùng địa điểm nguồn');
      return;
    }
    if (!updateStartDate || !updateEndDate) {
      toast.error('Vui lòng nhập dải ngày áp dụng chuyển đổi');
      return;
    }
    if (dayjs(updateStartDate).isAfter(dayjs(updateEndDate))) {
      toast.error('Ngày bắt đầu không được sau ngày kết thúc');
      return;
    }

    showLoading(true);
    try {
      const payload = {
        sourceLocationId: Number(updateSourceLoc),
        targetLocationIds: updateTargetLocs.map(Number),
        startDate: updateStartDate,
        endDate: updateEndDate,
        employeeIds: updateSelectedEmployees.length > 0 ? updateSelectedEmployees.map(Number) : undefined
      };
      
      const res = await assignmentService.bulkUpdateLocation(payload);
      if (res && res.success) {
        toast.success('Chuyển đổi địa điểm hàng loạt thành công!');
        setBulkResult(res.data);
        fetchAssignments();
        if (viewMode === 'calendar') fetchCalendar();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi chuyển đổi địa điểm');
    } finally {
      showLoading(false);
    }
  };

  const handleBulkDelete = (e) => {
    e.preventDefault();
    if (!deleteStartDate || !deleteEndDate) {
      toast.error('Vui lòng chọn dải ngày xóa phân công');
      return;
    }
    if (dayjs(deleteStartDate).isAfter(dayjs(deleteEndDate))) {
      toast.error('Ngày bắt đầu không được sau ngày kết thúc');
      return;
    }

    setBulkDeleteConfirmOpen(true);
  };

  const executeBulkDelete = async () => {
    setBulkDeleteConfirmOpen(false);
    showLoading(true);
    try {
      const payload = {
        startDate: deleteStartDate,
        endDate: deleteEndDate,
        locationId: deleteLocationId ? Number(deleteLocationId) : undefined,
        employeeIds: deleteSelectedEmployees.length > 0 ? deleteSelectedEmployees.map(Number) : undefined
      };
      
      const res = await assignmentService.bulkDeleteAssignments(payload);
      if (res && res.success) {
        toast.success('Xóa hàng loạt phân công thành công!');
        setBulkResult(res.data);
        fetchAssignments();
        if (viewMode === 'calendar') fetchCalendar();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa phân công hàng loạt');
    } finally {
      showLoading(false);
    }
  };

  const handleExecuteBulkEditSelected = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    if (bulkEditMode === 'REPLACE' && bulkEditLocationIds.length === 0 && !bulkEditShiftId && !bulkEditNote) {
      toast.error('Vui lòng chọn ít nhất 1 thông tin (Địa điểm, Ca làm việc hoặc Ghi chú) để cập nhật');
      return;
    }
    if (bulkEditMode === 'CUSTOM' && bulkEditAddLocationIds.length === 0 && bulkEditRemoveLocationIds.length === 0 && !bulkEditShiftId && !bulkEditNote) {
      toast.error('Vui lòng chọn ít nhất 1 thông tin thay đổi (Thêm/Xóa địa điểm, Ca làm việc hoặc Ghi chú)');
      return;
    }

    showLoading(true);
    try {
      const payload = {
        assignmentIds: selectedIds,
        shiftId: bulkEditShiftId ? Number(bulkEditShiftId) : undefined,
        note: bulkEditNote || undefined,
        mode: bulkEditMode
      };

      if (bulkEditMode === 'REPLACE') {
        payload.locationIds = bulkEditLocationIds.length > 0 ? bulkEditLocationIds.map(Number) : undefined;
      } else if (bulkEditMode === 'CUSTOM') {
        payload.addLocationIds = bulkEditAddLocationIds.length > 0 ? bulkEditAddLocationIds.map(Number) : undefined;
        payload.removeLocationIds = bulkEditRemoveLocationIds.length > 0 ? bulkEditRemoveLocationIds.map(Number) : undefined;
      }

      const res = await assignmentService.bulkUpdateSelectedAssignments(payload);
      if (res && res.success) {
        if (res.data.totalSkipped && res.data.totalSkipped > 0) {
          toast.warning(`Cập nhật thành công ${res.data.totalUpdated} phân công. Đã bỏ qua ${res.data.totalSkipped} phân công không hợp lệ.`);
        } else {
          toast.success(`Cập nhật thành công ${res.data.totalUpdated || selectedIds.length} phân công!`);
        }
        setBulkEditModalOpen(false);
        setSelectedIds([]);
        fetchAssignments();
        if (viewMode === 'calendar') fetchCalendar();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật phân công hàng loạt');
    } finally {
      showLoading(false);
    }
  };

  const handleExecuteBulkDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setSelectedDeleteConfirmOpen(false);
    showLoading(true);
    try {
      const payload = {
        assignmentIds: selectedIds
      };
      const res = await assignmentService.bulkDeleteSelectedAssignments(payload);
      if (res && res.success) {
        toast.success(`Đã xóa thành công ${res.data.totalDeleted || selectedIds.length} phân công!`);
        setSelectedIds([]);
        fetchAssignments();
        if (viewMode === 'calendar') fetchCalendar();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa phân công hàng loạt');
    } finally {
      showLoading(false);
    }
  };

  const isAllSelected = assignments.length > 0 && assignments.every(a => selectedIds.includes(a.assignmentId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assignments.map(a => a.assignmentId));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
    { key: 'assignmentId', label: 'ID', sortable: true },
    { key: 'employee_code', label: 'Nhân viên', sortable: false },
    { key: 'department_name', label: 'Phòng ban', sortable: false },
    { key: 'location_name', label: 'Địa điểm', sortable: false },
    { key: 'workDate', label: 'Ngày làm việc', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true },
    { key: 'actions', label: 'Hành động', sortable: false, width: '130px' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-primary-600" />
            Quản lý phân công địa điểm
          </h1>
          <p className="text-xs text-slate-500">Phân bổ nhân sự kỹ thuật vào các vị trí công trình theo ngày</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* View mode buttons */}
          <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-0.5 bg-white dark:bg-slate-900 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                : 'text-slate-450 hover:text-slate-700'
                }`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'calendar'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                : 'text-slate-450 hover:text-slate-700'
                }`}
            >
              Lịch biểu
            </button>
          </div>

          <Button 
            variant="secondary" 
            size="sm" 
            icon={<FiLayers />} 
            onClick={() => {
              setBulkModalOpen(true);
              setBulkResult(null);
              setBulkSelectedEmployees([]);
              setBulkLocationIds([]);
              setBulkShiftId('');
              setBulkStartDate(dayjs().format('YYYY-MM-DD'));
              setBulkEndDate(dayjs().add(7, 'day').format('YYYY-MM-DD'));
              setBulkRecurrenceType('NONE');
              setBulkRecurrenceDays([]);
              setBulkNote('');
              setBulkDeptFilter('');
              setBulkEmpSearch('');
              setUpdateSourceLoc('');
              setUpdateTargetLocs([]);
              setUpdateSelectedEmployees([]);
              setDeleteSelectedEmployees([]);
              setBulkTab('create');
            }}
          >
            Phân công hàng loạt
          </Button>
          <Button variant="primary" size="sm" icon={<FiPlus />} onClick={handleOpenCreateModal}>
            Phân công mới 
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card className="flex flex-col gap-5">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <SearchBox value={keyword} onChange={handleSearch} placeholder="Tìm mã, tên nhân viên..." />

            <Select
              name="dept"
              value={deptFilter}
              onChange={handleFilterChange(setDeptFilter)}
              options={departments.map(d => ({ value: d.departmentId ?? d.department_id, label: d.departmentName ?? d.department_name }))}
              placeholder="Tất cả phòng ban"
            />
            <Select
              name="loc"
              value={locFilter}
              onChange={handleFilterChange(setLocFilter)}
              options={locations.map(l => ({ value: l.locationId ?? l.location_id, label: l.locationName ?? l.location_name }))}
              placeholder="Tất cả địa điểm"
            />
            <DatePicker
              value={dateFilter}
              onChange={handleFilterChange(setDateFilter)}
              placeholder="Ngày làm việc"
            />
            <Select
              name="status"
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
              options={[
                { value: 'ASSIGNED', label: 'Đã phân công' },
                { value: 'CANCELLED', label: 'Đã hủy' },
                { value: 'COMPLETED', label: 'Hoàn thành' }
              ]}
              placeholder="Tất cả trạng thái"
            />
          </div>

          <Table
            headers={headers}
            items={assignments}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            renderRow={(a) => (
              <>
                <td className="px-3 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(a.assignmentId)}
                    onChange={() => toggleSelectRow(a.assignmentId)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                  {a.assignmentId}
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-850 dark:text-slate-200">
                  <div className="flex flex-col">
                    <span>{a.employee?.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">{a.employee?.employeeCode}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {a.employee?.departmentName}
                </td>
                <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-350">
                  {a.allowedLocations && a.allowedLocations.length > 0 
                    ? a.allowedLocations.map(l => l.locationName || l.location_name).join(', ')
                    : a.location?.locationName}
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-800 dark:text-slate-350">
                  {dayjs(a.workDate).format('DD/MM/YYYY')}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge type="assignment" value={a.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {a.status === 'ASSIGNED' && !a.hasAttendance && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(a)}
                          title="Chỉnh sửa"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/15 transition-all"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenCancelDialog(a.assignmentId)}
                          title="Hủy phân công"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-all"
                        >
                          <FiXCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
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
      ) : (
        <Card className="space-y-6 flex flex-col">
          {/* Calendar Header with Navigation and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-650 dark:text-slate-400 cursor-pointer"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 min-w-[140px] text-center">
                Tháng {String(calendarMonth).padStart(2, '0')} / {calendarYear}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-655 dark:text-slate-400 cursor-pointer"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-650 dark:text-slate-400 cursor-pointer"
              >
                Hôm nay
              </button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-44">
                <Select
                  name="calendarDept"
                  value={deptFilter}
                  onChange={handleFilterChange(setDeptFilter)}
                  options={departments.map(d => ({ value: d.departmentId ?? d.department_id, label: d.departmentName ?? d.department_name }))}
                  placeholder="Tất cả phòng ban"
                />
              </div>
              <div className="w-44">
                <Select
                  name="calendarLoc"
                  value={locFilter}
                  onChange={handleFilterChange(setLocFilter)}
                  options={locations.map(l => ({ value: l.locationId ?? l.location_id, label: l.locationName ?? l.location_name }))}
                  placeholder="Tất cả địa điểm"
                />
              </div>
            </div>
          </div>

          {calendarLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
              <span className="text-xs">Đang tải lịch biểu...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-px text-center">
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((day) => (
                  <div key={day} className="py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid of days */}
              <div className="grid grid-cols-7 gap-1.5">
                {(() => {
                  const startOfMonth = dayjs(`${calendarYear}-${calendarMonth}-01`);
                  const startDayOfWeek = startOfMonth.day(); // 0 is Sunday
                  const padDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
                  const totalDaysInMonth = startOfMonth.daysInMonth();
                  
                  const cells = [];
                  
                  // Padded days from previous month
                  const prevMonthEnd = startOfMonth.subtract(1, 'day');
                  for (let i = padDays - 1; i >= 0; i--) {
                    const d = prevMonthEnd.subtract(i, 'day');
                    cells.push({ date: d, isCurrentMonth: false, dateStr: d.format('YYYY-MM-DD') });
                  }
                  
                  // Current month days
                  for (let i = 1; i <= totalDaysInMonth; i++) {
                    const d = startOfMonth.date(i);
                    cells.push({ date: d, isCurrentMonth: true, dateStr: d.format('YYYY-MM-DD') });
                  }
                  
                  // Padded days from next month
                  const totalCells = cells.length <= 35 ? 35 : 42;
                  const remainingCells = totalCells - cells.length;
                  const endOfMonth = startOfMonth.endOf('month');
                  for (let i = 1; i <= remainingCells; i++) {
                    const d = endOfMonth.add(i, 'day');
                    cells.push({ date: d, isCurrentMonth: false, dateStr: d.format('YYYY-MM-DD') });
                  }

                  return cells.map((cell, idx) => {
                    const isToday = cell.dateStr === dayjs().format('YYYY-MM-DD');
                    const dayAssigns = calendarDays[cell.dateStr] || [];
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDayDetails(cell.dateStr)}
                        className={`min-h-[100px] p-2 rounded-2xl border flex flex-col gap-1.5 justify-between transition-all hover:shadow-md cursor-pointer group ${
                          isToday 
                            ? 'bg-primary-50/10 dark:bg-primary-955/5 border-primary-500/40 hover:border-primary-500' 
                            : cell.isCurrentMonth
                              ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700'
                              : 'bg-slate-50/30 dark:bg-slate-950/5 border-slate-50/50 dark:border-slate-950/5 opacity-50'
                        }`}
                      >
                        {/* Day number */}
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs font-bold font-heading w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              isToday
                                ? 'bg-primary-600 text-white shadow-sm'
                                : cell.isCurrentMonth
                                  ? 'text-slate-700 dark:text-slate-300'
                                  : 'text-slate-400 dark:text-slate-600'
                            }`}
                          >
                            {cell.date.date()}
                          </span>
                          {cell.isCurrentMonth && (
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-primary-600 font-bold hover:underline transition-all">
                              + Thêm
                            </span>
                          )}
                        </div>

                        {/* List of assignments */}
                        <div className="flex-1 space-y-1 overflow-y-auto max-h-[70px] pr-0.5 custom-scrollbar">
                          {dayAssigns.slice(0, 3).map((a) => (
                            <div
                              key={a.assignmentId}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDayDetails(cell.dateStr);
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded-lg bg-primary-50/70 dark:bg-primary-950/20 text-primary-750 dark:text-primary-300 border border-primary-100/40 dark:border-primary-900/30 truncate font-semibold"
                              title={`${a.employeeName} - ${a.locationName}`}
                            >
                              {a.employeeName} @ {a.locationName}
                            </div>
                          ))}
                          {dayAssigns.length > 3 && (
                            <div className="text-[8.5px] font-bold text-center text-primary-600 dark:text-primary-400 mt-0.5">
                              + {dayAssigns.length - 3} phân công khác
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingAssign ? 'Chỉnh sửa phân công' : 'Thêm phân công công việc'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <Select
            label="Chọn Nhân viên"
            name="employeeId"
            options={employees.map(e => ({ value: e.employeeId ?? e.employee_id, label: `${e.fullName ?? e.full_name} (${e.employeeCode ?? e.employee_code})` }))}
            placeholder="Chọn nhân viên..."
            disabled={!!editingAssign}
            error={errors.employeeId}
            {...register('employeeId')}
          />
          
          <Controller
            control={control}
            name="locationIds"
            render={({ field }) => (
              <MultiSelect
                label="Chọn Địa điểm làm việc (Có thể chọn nhiều)"
                options={locations.map(l => ({
                  value: l.locationId ?? l.location_id,
                  label: l.locationName ?? l.location_name
                }))}
                value={field.value || []}
                onChange={field.onChange}
                error={errors.locationIds}
                placeholder="Chọn địa điểm..."
              />
            )}
          />

          <Select
            label="Chọn Ca làm việc"
            name="shiftId"
            options={shifts.map(s => {
              const name = s.shiftName ?? s.shift_name;
              const start = s.startTime?.substring(0, 5);
              const end = s.endTime?.substring(0, 5);
              const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
              const label = `${cleanName} (${start} - ${end})`;
              return { value: s.shiftId ?? s.shift_id, label };
            })}
            placeholder="Chọn ca..."
            error={errors.shiftId}
            {...register('shiftId')}
          />

          <DatePicker
            label="Ngày làm việc"
            name="workDate"
            error={errors.workDate}
            {...register('workDate')}
          />
          
          <Input
            label="Ghi chú thêm"
            name="note"
            placeholder="Nhập ghi chú..."
            error={errors.note}
            {...register('note')}
          />

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setFormModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Lưu phân công
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Dialog Confirmation */}
     <Modal
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Xác nhận hủy phân công"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">
              Bạn có chắc chắn muốn hủy phân công này không?
            </p>

            <p className="text-xs text-amber-700 mt-2">
              Sau khi hủy, nhân viên sẽ không thể chấm công tại địa điểm này trong
              ngày đã chỉ định.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Lý do hủy <span className="text-red-500">*</span>
            </label>

            <textarea
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy phân công..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason('');
              }}
            >
              Quay lại
            </Button>

            <Button
              variant="danger"
              onClick={handleCancelAssignment}
            >
              Đồng ý hủy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Calendar Day Details Modal */}
      <Modal
        isOpen={!!selectedDayDetails}
        onClose={() => setSelectedDayDetails(null)}
        title={`Chi tiết phân công ngày ${selectedDayDetails ? dayjs(selectedDayDetails).format('DD/MM/YYYY') : ''}`}
        size="lg"
      >
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-semibold text-slate-500">Danh sách nhân viên được phân công:</h4>
            <Button 
              variant="primary" 
              size="xs" 
              icon={<FiPlus />} 
              onClick={() => {
                const date = selectedDayDetails;
                setSelectedDayDetails(null);
                handleOpenCreateModalForDate(date);
              }}
            >
              Thêm phân công
            </Button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="px-4 py-3 font-semibold">Nhân viên</th>
                  <th className="px-4 py-3 font-semibold">Địa điểm</th>
                  <th className="px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedDayDetails && (calendarDays[selectedDayDetails] || []).length > 0 ? (
                  (calendarDays[selectedDayDetails] || []).map((a) => (
                    <tr key={a.assignmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {a.employeeName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                        {a.locationName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditFromCalendar(a.assignmentId)}
                            title="Chỉnh sửa"
                            className="p-1 rounded border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/15 transition-all"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleCancelFromCalendar(a.assignmentId)}
                            title="Hủy phân công"
                            className="p-1 rounded border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-all"
                          >
                            <FiXCircle className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">
                      Chưa có phân công nào trong ngày này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedDayDetails(null)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Operations Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Quản lý phân công hàng loạt"
        size="lg"
      >
        <div className="space-y-5 text-left">
          {/* Tab Navigation */}
          {!bulkResult && (
            <div className="flex border-b border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBulkTab('create')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                  bulkTab === 'create'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiPlus /> Tạo hàng loạt
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('copy')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                  bulkTab === 'copy'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiCopy /> Sao chép tuần
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('update')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                  bulkTab === 'update'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiRefreshCw /> Đổi địa điểm
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('delete')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                  bulkTab === 'delete'
                    ? 'border-primary-500 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiTrash2 /> Xóa hàng loạt
              </button>
            </div>
          )}

          {/* Result View */}
          {bulkResult ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-4">
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-2">Kết quả xử lý thành công!</h4>
                <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <div>Yêu cầu: <span className="text-slate-900 dark:text-white font-bold">{bulkResult.totalRequested || bulkResult.totalFound || 0}</span></div>
                  <div>Thành công: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{bulkResult.totalCreated || bulkResult.totalCopied || bulkResult.totalDeleted || bulkResult.totalUpdated || 0}</span></div>
                  <div>Bị bỏ qua: <span className="text-amber-600 dark:text-amber-400 font-bold">{bulkResult.totalSkipped || 0}</span></div>
                </div>
              </div>

              {bulkResult.skippedDetails && bulkResult.skippedDetails.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-500">Danh sách dòng bị bỏ qua (Trùng lặp hoặc Lỗi):</h5>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-3 py-2">Nhân viên</th>
                          <th className="px-3 py-2">Ngày áp dụng</th>
                          <th className="px-3 py-2">Lý do</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bulkResult.skippedDetails.map((detail, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                            <td className="px-3 py-2 text-slate-800 dark:text-slate-200 font-medium">
                              {detail.employeeName || `ID ${detail.employeeId}`}
                            </td>
                            <td className="px-3 py-2 text-slate-500 font-mono">
                              {detail.workDate || (detail.dates ? detail.dates.join(', ') : 'N/A')}
                            </td>
                            <td className="px-3 py-2 text-amber-600 dark:text-amber-400">
                              {detail.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="secondary" size="sm" onClick={() => setBulkResult(null)}>
                  Quay lại biểu mẫu
                </Button>
              </div>
            </div>
          ) : (
            /* Forms container */
            <div className="space-y-4">
              {/* Tab 1: Bulk Create Form */}
              {bulkTab === 'create' && (
                <form onSubmit={handleBulkCreate} className="space-y-4">
                  {/* Select Employees */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 1: Chọn nhân sự áp dụng</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        placeholder="Lọc theo phòng ban"
                        value={bulkDeptFilter}
                        onChange={(e) => setBulkDeptFilter(e.target.value)}
                        options={departments.map(d => ({ value: d.departmentId ?? d.department_id, label: d.departmentName ?? d.department_name }))}
                      />
                      <SearchBox
                        value={bulkEmpSearch}
                        onChange={setBulkEmpSearch}
                        placeholder="Tìm nhân viên..."
                      />
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/20">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Đã chọn {bulkSelectedEmployees.length} nhân viên
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const filteredIds = employees
                              .filter(e => (!bulkDeptFilter || (e.departmentId ?? e.department?.departmentId) === Number(bulkDeptFilter)) && 
                                           (!bulkEmpSearch || e.fullName?.toLowerCase().includes(bulkEmpSearch.toLowerCase()) || e.employeeCode?.toLowerCase().includes(bulkEmpSearch.toLowerCase())))
                              .map(e => e.employeeId ?? e.employee_id);
                            if (bulkSelectedEmployees.length === filteredIds.length) {
                              setBulkSelectedEmployees([]);
                            } else {
                              setBulkSelectedEmployees(filteredIds);
                            }
                          }}
                          className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer bg-transparent border-0"
                        >
                          {bulkSelectedEmployees.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn toàn bộ kết quả lọc'}
                        </button>
                      </div>

                      <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {employees
                          .filter(e => (!bulkDeptFilter || (e.departmentId ?? e.department?.departmentId) === Number(bulkDeptFilter)) && 
                                       (!bulkEmpSearch || e.fullName?.toLowerCase().includes(bulkEmpSearch.toLowerCase()) || e.employeeCode?.toLowerCase().includes(bulkEmpSearch.toLowerCase())))
                          .map(e => {
                            const id = e.employeeId ?? e.employee_id;
                            const isChecked = bulkSelectedEmployees.includes(id);
                            return (
                              <label key={id} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setBulkSelectedEmployees(prev => prev.filter(x => x !== id));
                                    } else {
                                      setBulkSelectedEmployees(prev => [...prev, id]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                                />
                                <div className="truncate">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{e.fullName ?? e.full_name}</span>
                                  <span className="text-[9.5px] text-slate-450 ml-1 font-mono">({e.employeeCode ?? e.employee_code})</span>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Target and Shifts */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 2: Địa điểm & Ca làm việc</label>
                    <div className="grid grid-cols-2 gap-4">
                      <MultiSelect
                        label="Địa điểm làm việc (Có thể chọn nhiều)"
                        options={locations.map(l => ({
                          value: l.locationId ?? l.location_id,
                          label: l.locationName ?? l.location_name
                        }))}
                        value={bulkLocationIds || []}
                        onChange={(vals) => setBulkLocationIds(vals)}
                        placeholder="Chọn địa điểm..."
                      />
                      <Select
                        label="Ca làm việc (Tùy chọn)"
                        value={bulkShiftId}
                        onChange={(e) => setBulkShiftId(e.target.value)}
                        options={shifts.map(s => {
                          const name = s.shiftName ?? s.shift_name;
                          const start = s.startTime?.substring(0, 5);
                          const end = s.endTime?.substring(0, 5);
                          const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
                          const label = `${cleanName} (${start} - ${end})`;
                          return { value: s.shiftId ?? s.shift_id, label };
                        })}
                        placeholder="-- Chọn ca làm việc --"
                      />
                    </div>
                  </div>

                  {/* Timesheet range and repeats */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 3: Thời gian & Chu kỳ</label>
                    <div className="grid grid-cols-2 gap-4">
                      <DatePicker
                        label="Từ ngày"
                        value={bulkStartDate}
                        onChange={(e) => setBulkStartDate(e.target.value)}
                        required
                      />
                      <DatePicker
                        label="Đến ngày"
                        value={bulkEndDate}
                        onChange={(e) => setBulkEndDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2 border border-slate-150 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-bold text-slate-650">Chế độ lặp:</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrence"
                            checked={bulkRecurrenceType === 'NONE'}
                            onChange={() => {
                              setBulkRecurrenceType('NONE');
                              setBulkRecurrenceDays([]);
                            }}
                            className="text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                          />
                           Tất cả các ngày
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrence"
                            checked={bulkRecurrenceType === 'WEEKLY'}
                            onChange={() => {
                              setBulkRecurrenceType('WEEKLY');
                              setBulkRecurrenceDays([1, 2, 3, 4, 5]); // default Mon-Fri
                            }}
                            className="text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                          />
                          Chọn ngày trong tuần
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrence"
                            checked={bulkRecurrenceType === 'MONTHLY'}
                            onChange={() => {
                              setBulkRecurrenceType('MONTHLY');
                              setBulkRecurrenceDays([1]); // default 1st
                            }}
                            className="text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                          />
                          Chọn ngày trong tháng
                        </label>
                      </div>

                      {bulkRecurrenceType === 'WEEKLY' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-xs flex-wrap">
                          <span className="text-slate-400 font-medium">Chọn ngày trong tuần:</span>
                          {[
                            { label: 'T2', val: 1 },
                            { label: 'T3', val: 2 },
                            { label: 'T4', val: 3 },
                            { label: 'T5', val: 4 },
                            { label: 'T6', val: 5 },
                            { label: 'T7', val: 6 },
                            { label: 'CN', val: 0 }
                          ].map(day => {
                            const isChecked = bulkRecurrenceDays.includes(day.val);
                            return (
                              <label key={day.val} className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setBulkRecurrenceDays(prev => prev.filter(d => d !== day.val));
                                    } else {
                                      setBulkRecurrenceDays(prev => [...prev, day.val]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                                />
                                <span className="font-bold">{day.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {bulkRecurrenceType === 'MONTHLY' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          <span className="text-xs text-slate-400 font-medium block">Chọn ngày trong tháng:</span>
                          <div className="grid grid-cols-10 gap-1.5 text-[10px]">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                              const isChecked = bulkRecurrenceDays.includes(day);
                              return (
                                <label key={day} className={`flex items-center justify-center p-1 border rounded-lg cursor-pointer select-none font-bold transition-all ${
                                  isChecked 
                                    ? 'bg-primary-50 text-primary-600 border-primary-200' 
                                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setBulkRecurrenceDays(prev => prev.filter(d => d !== day));
                                      } else {
                                        setBulkRecurrenceDays(prev => [...prev, day]);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  {day}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  <Input
                    label="Ghi chú (Tùy chọn)"
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    placeholder="Nhập ghi chú chung cho phân công này..."
                  />

                  {/* Footer buttons */}
                  <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" variant="primary">
                      Lưu phân công hàng loạt
                    </Button>
                  </div>
                </form>
              )}

              {/* Tab 2: Copy Week Form */}
              {bulkTab === 'copy' && (
                <form onSubmit={handleBulkCopy} className="space-y-5">
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 p-3">
                    <p className="text-xs text-indigo-800 dark:text-indigo-400 leading-relaxed flex items-start gap-1.5">
                      <FiInfo className="mt-0.5 shrink-0" />
                      Hệ thống sẽ quét toàn bộ phân công đang hoạt động ở **Tuần nguồn** (7 ngày kể từ Ngày bắt đầu tuần nguồn được chọn) và nhân bản y hệt sang **Tuần đích** (bắt đầu từ Ngày tuần đích được chọn). Những lịch trùng ở tuần đích sẽ tự động được bỏ qua.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <DatePicker
                      label="Bắt đầu Tuần nguồn (Thứ 2)"
                      value={copySourceDate}
                      onChange={(e) => setCopySourceDate(e.target.value)}
                      required
                    />
                    <DatePicker
                      label="Bắt đầu Tuần đích (Thứ 2)"
                      value={copyTargetDate}
                      onChange={(e) => setCopyTargetDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" variant="primary">
                      Thực hiện Sao chép
                    </Button>
                  </div>
                </form>
              )}

              {/* Tab 3: Bulk Update Location Form */}
              {bulkTab === 'update' && (
                <form onSubmit={handleBulkUpdateLocation} className="space-y-4">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed flex items-start gap-1.5">
                      <FiInfo className="mt-0.5 shrink-0" />
                      Chuyển phân công của các nhân sự đang làm việc tại **Địa điểm A (Nguồn)** sang **Địa điểm B (Đích)** trong khoảng thời gian xác định. Các ca đã chấm công thực tế sẽ giữ nguyên địa điểm cũ để tránh sai lệch dữ liệu lịch sử.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <MultiSelect
                      label="Địa điểm nguồn (A)"
                      options={locations.map(l => ({
                        value: l.locationId ?? l.location_id,
                        label: l.locationName ?? l.location_name
                      }))}
                      value={updateSourceLoc ? [Number(updateSourceLoc)] : []}
                      onChange={(vals) => {
                        const lastVal = vals[vals.length - 1];
                        setUpdateSourceLoc(lastVal ? String(lastVal) : '');
                      }}
                      placeholder="Chọn địa điểm nguồn..."
                    />
                    <MultiSelect
                      label="Địa điểm đích (B) (Có thể chọn nhiều)"
                      options={locations.map(l => ({
                        value: l.locationId ?? l.location_id,
                        label: l.locationName ?? l.location_name
                      }))}
                      value={updateTargetLocs || []}
                      onChange={(vals) => setUpdateTargetLocs(vals)}
                      placeholder="Chọn địa điểm đích..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <DatePicker
                      label="Từ ngày"
                      value={updateStartDate}
                      onChange={(e) => setUpdateStartDate(e.target.value)}
                      required
                    />
                    <DatePicker
                      label="Đến ngày"
                      value={updateEndDate}
                      onChange={(e) => setUpdateEndDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Selected Employees (Optional) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn nhân viên cụ thể (Tùy chọn - Mặc định chuyển tất cả)</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        placeholder="Lọc theo phòng ban"
                        value={updateDeptFilter}
                        onChange={(e) => setUpdateDeptFilter(e.target.value)}
                        options={departments.map(d => ({ value: d.departmentId ?? d.department_id, label: d.departmentName ?? d.department_name }))}
                      />
                      <SearchBox
                        value={updateEmpSearch}
                        onChange={setUpdateEmpSearch}
                        placeholder="Tìm nhân viên..."
                      />
                    </div>

                    <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                      {employees
                        .filter(e => (!updateDeptFilter || e.departmentId === Number(updateDeptFilter)) && 
                                     (!updateEmpSearch || e.fullName?.toLowerCase().includes(updateEmpSearch.toLowerCase()) || e.employeeCode?.toLowerCase().includes(updateEmpSearch.toLowerCase())))
                        .map(e => {
                          const id = e.employeeId ?? e.employee_id;
                          const isChecked = updateSelectedEmployees.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setUpdateSelectedEmployees(prev => prev.filter(x => x !== id));
                                  } else {
                                    setUpdateSelectedEmployees(prev => [...prev, id]);
                                  }
                                }}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{e.fullName ?? e.full_name} ({e.employeeCode ?? e.employee_code})</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" variant="primary">
                      Đồng ý chuyển đổi
                    </Button>
                  </div>
                </form>
              )}

              {/* Tab 4: Bulk Delete Form */}
              {bulkTab === 'delete' && (
                <form onSubmit={handleBulkDelete} className="space-y-4">
                  <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-3">
                    <p className="text-xs text-rose-800 dark:text-rose-400 font-bold flex items-start gap-1.5">
                      <FiAlertTriangle className="mt-0.5 text-rose-600 shrink-0" />
                      CẢNH BÁO NGUY HIỂM: Hành động này sẽ xóa vĩnh viễn các phân công trong khoảng thời gian đã chọn. Hệ thống sẽ giữ an toàn tuyệt đối cho những ca đã phát sinh dữ liệu chấm công thực tế.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <DatePicker
                      label="Từ ngày"
                      value={deleteStartDate}
                      onChange={(e) => setDeleteStartDate(e.target.value)}
                      required
                    />
                    <DatePicker
                      label="Đến ngày"
                      value={deleteEndDate}
                      onChange={(e) => setDeleteEndDate(e.target.value)}
                      required
                    />
                  </div>

                  <Select
                    label="Chỉ xóa tại Địa điểm làm việc (Tùy chọn - Để trống để áp dụng mọi nơi)"
                    value={deleteLocationId}
                    onChange={(e) => setDeleteLocationId(e.target.value)}
                    options={locations.map(l => ({ value: l.locationId ?? l.location_id, label: l.locationName ?? l.location_name }))}
                    placeholder="Tất cả địa điểm..."
                  />

                  {/* Filter Employees to delete */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Chỉ áp dụng cho Nhân viên (Tùy chọn - Để trống để áp dụng cho tất cả)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        placeholder="Lọc theo phòng ban"
                        value={deleteDeptFilter}
                        onChange={(e) => setDeleteDeptFilter(e.target.value)}
                        options={departments.map(d => ({ value: d.departmentId ?? d.department_id, label: d.departmentName ?? d.department_name }))}
                      />
                      <SearchBox
                        value={deleteEmpSearch}
                        onChange={setDeleteEmpSearch}
                        placeholder="Tìm nhân viên..."
                      />
                    </div>

                    <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                      {employees
                        .filter(e => (!deleteDeptFilter || e.departmentId === Number(deleteDeptFilter)) && 
                                     (!deleteEmpSearch || e.fullName?.toLowerCase().includes(deleteEmpSearch.toLowerCase()) || e.employeeCode?.toLowerCase().includes(deleteEmpSearch.toLowerCase())))
                        .map(e => {
                          const id = e.employeeId ?? e.employee_id;
                          const isChecked = deleteSelectedEmployees.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-950/20 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setDeleteSelectedEmployees(prev => prev.filter(x => x !== id));
                                  } else {
                                    setDeleteSelectedEmployees(prev => [...prev, id]);
                                  }
                                }}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{e.fullName ?? e.full_name} ({e.employeeCode ?? e.employee_code})</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" variant="danger">
                      Tiến hành xóa vĩnh viễn
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && !bulkModalOpen && !bulkEditModalOpen && !selectedDeleteConfirmOpen && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-slide-up pointer-events-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-r border-slate-700 pr-4">
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[11px] font-bold">
              {selectedIds.length}
            </span>
            <span>Đã chọn {selectedIds.length} phân công</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentLocs = new Set();
                selectedIds.forEach(id => {
                  const assignment = assignments.find(a => a.assignmentId === id);
                  if (assignment) {
                    if (assignment.allowedLocations && assignment.allowedLocations.length > 0) {
                      assignment.allowedLocations.forEach(l => currentLocs.add(l.locationId || l.location_id));
                    } else if (assignment.locationId || assignment.location_id) {
                      currentLocs.add(assignment.locationId || assignment.location_id);
                    }
                  }
                });
                setBulkEditCurrentLocationIds(Array.from(currentLocs));
                setBulkEditAddLocationIds([]);
                setBulkEditRemoveLocationIds([]);
                setBulkEditLocationIds([]);
                setBulkEditShiftId('');
                setBulkEditNote('');
                setBulkEditMode('CUSTOM');
                setBulkEditModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              Sửa hàng loạt
            </button>

            <button
              onClick={() => setSelectedDeleteConfirmOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              Xóa hàng loạt
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Hủy chọn"
            >
              <FiXCircle className="w-4 h-4" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Bulk Edit Selected Assignments */}
      {bulkEditModalOpen && (
        <Modal
          isOpen={bulkEditModalOpen}
          onClose={() => setBulkEditModalOpen(false)}
          title={`Sửa hàng loạt ${selectedIds.length} phân công đã chọn`}
        >
          <form onSubmit={handleExecuteBulkEditSelected} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Chế độ cập nhật địa điểm:
              </label>
              <div className="flex flex-col sm:flex-row gap-4 text-xs font-medium mb-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="CUSTOM"
                    checked={bulkEditMode === 'CUSTOM'}
                    onChange={() => setBulkEditMode('CUSTOM')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span>Tùy chỉnh (Thêm/Xóa địa điểm)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="REPLACE"
                    checked={bulkEditMode === 'REPLACE'}
                    onChange={() => setBulkEditMode('REPLACE')}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span>Chọn lại từ đầu (Thay thế toàn bộ)</span>
                </label>
              </div>

              {bulkEditMode === 'CUSTOM' ? (
                <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Địa điểm đang có (Click dấu X để xóa):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {/* Calculate effectively assigned locations */}
                      {Array.from(new Set([...bulkEditCurrentLocationIds.filter(id => !bulkEditRemoveLocationIds.includes(id)), ...bulkEditAddLocationIds])).map(locId => {
                        const loc = locations.find(l => (l.locationId ?? l.location_id) === locId);
                        if (!loc) return null;
                        return (
                          <div key={locId} className="flex items-center gap-1 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 px-2.5 py-1 rounded-md text-xs font-medium border border-primary-200 dark:border-primary-800">
                            <span>{loc.locationName ?? loc.location_name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (bulkEditAddLocationIds.includes(locId)) {
                                  setBulkEditAddLocationIds(prev => prev.filter(id => id !== locId));
                                } else {
                                  setBulkEditRemoveLocationIds(prev => [...prev, locId]);
                                }
                              }}
                              className="text-primary-600 dark:text-primary-400 hover:text-red-500 transition-colors"
                            >
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      {Array.from(new Set([...bulkEditCurrentLocationIds.filter(id => !bulkEditRemoveLocationIds.includes(id)), ...bulkEditAddLocationIds])).length === 0 && (
                        <span className="text-xs text-slate-400 italic">Chưa có địa điểm nào</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Địa điểm chưa thêm (Tick để bổ sung):
                    </label>
                    <div className="max-h-32 overflow-y-auto grid grid-cols-2 gap-2 text-xs">
                      {locations
                        .filter(l => {
                          const id = l.locationId ?? l.location_id;
                          const currentEffective = new Set([...bulkEditCurrentLocationIds.filter(i => !bulkEditRemoveLocationIds.includes(i)), ...bulkEditAddLocationIds]);
                          return !currentEffective.has(id);
                        })
                        .map(l => {
                          const id = l.locationId ?? l.location_id;
                          return (
                            <label key={id} className="flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-slate-800 p-1.5 rounded-md transition-colors">
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => {
                                  if (bulkEditRemoveLocationIds.includes(id)) {
                                    setBulkEditRemoveLocationIds(prev => prev.filter(x => x !== id));
                                  } else {
                                    setBulkEditAddLocationIds(prev => [...prev, id]);
                                  }
                                }}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-slate-700 dark:text-slate-300">{l.locationName ?? l.location_name}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chọn lại Địa điểm làm việc mới:
                  </label>
                  <MultiSelect
                    options={locations.map(l => ({ value: l.locationId ?? l.location_id, label: l.locationName ?? l.location_name }))}
                    value={bulkEditLocationIds}
                    onChange={setBulkEditLocationIds}
                    placeholder="Chọn một hoặc nhiều địa điểm"
                  />
                </div>
              )}
            </div>

            <Select
              label="Ca làm việc (Tùy chọn):"
              name="bulkShift"
              value={bulkEditShiftId}
              onChange={(e) => setBulkEditShiftId(e.target.value)}
              options={shifts.map(s => {
                const name = s.shiftName ?? s.shift_name ?? '';
                const start = s.startTime?.substring(0, 5) || '';
                const end = s.endTime?.substring(0, 5) || '';
                const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
                const label = start && end ? `${cleanName} (${start} - ${end})` : cleanName;
                return { value: s.shiftId ?? s.shift_id, label };
              })}
              placeholder="-- Giữ nguyên ca cũ --"
            />

            <Input
              label="Ghi chú chung (Tùy chọn):"
              name="bulkNote"
              value={bulkEditNote}
              onChange={(e) => setBulkEditNote(e.target.value)}
              placeholder="Nhập ghi chú..."
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" size="sm" onClick={() => setBulkEditModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Lưu thay đổi ({selectedIds.length} phân công)
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Selected Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={selectedDeleteConfirmOpen}
        onClose={() => setSelectedDeleteConfirmOpen(false)}
        onConfirm={handleExecuteBulkDeleteSelected}
        title={`Xóa ${selectedIds.length} phân công đã chọn`}
        message={`CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} phân công được chọn không? Những phân công đã phát sinh dữ liệu chấm công thực tế sẽ không thể bị xóa.`}
        confirmLabel="Đồng ý xóa"
        cancelLabel="Hủy"
      />

      {/* Confirm Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={executeBulkDelete}
        title="Xác nhận xóa hàng loạt phân công"
        message="CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa hàng loạt toàn bộ lịch phân công thỏa mãn điều kiện không? Hành động này không thể hoàn tác và chỉ có những lịch phân công chưa có chấm công thực tế mới bị xóa."
        confirmLabel="Đồng ý xóa"
        cancelLabel="Quay lại"
      />
    </div>
  );
};

export default Assignments;
