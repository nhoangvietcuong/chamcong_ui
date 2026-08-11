import React, { useState, useEffect, useCallback } from 'react';
import {
  FiActivity, FiCompass, FiRefreshCw, FiClock
} from 'react-icons/fi';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';
import dayjs from 'dayjs';

import attendanceService from '../services/attendanceService';
import employeeService from '../services/employeeService';
import departmentService from '../services/departmentService';
import workLocationService from '../services/workLocationService';
import useApp from '../hooks/useApp';
import usePagination from '../hooks/usePagination';

import api from '../services/api';

const getBackendUrl = (path) => {
  if (!path) return null;
  let fullUrl = path;
  if (!path.startsWith('http')) {
    let origin = 'http://localhost:3000';
    if (api && api.defaults && api.defaults.baseURL) {
      origin = api.defaults.baseURL.replace(/\/api\/?$/, '');
    }
    fullUrl = `${origin}${path}`;
  }
  const token = localStorage.getItem('accessToken');
  if (token && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}token=${token}`;
  }
  return fullUrl;
};

export const Attendance = () => {
  const { toast } = useApp();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);

  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [attendancePhotos, setAttendancePhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    if (selectedAttendance) {
      setActiveTab('info');
      setLoadingPhotos(true);
      api.get(`/admin/attendance/${selectedAttendance.attendanceId}/photos`)
        .then((res) => {
          if (res && res.success) {
            setAttendancePhotos(res.data || []);
          }
        })
        .catch((err) => {
          console.error('Error fetching attendance photos:', err);
        })
        .finally(() => {
          setLoadingPhotos(false);
        });
    } else {
      setAttendancePhotos([]);
    }
  }, [selectedAttendance]);

  // Data states
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lookups
  const [employeesOptions, setEmployeesOptions] = useState([]);
  const [departmentsOptions, setDepartmentsOptions] = useState([]);
  const [locationsOptions, setLocationsOptions] = useState([]);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [isOfflineSync, setIsOfflineSync] = useState('');

  const getAttendanceStatus = (item) => {
    if (!item) return '';
    if (item.attendanceStatus === 'IN_PROGRESS') {
      const itemDate = dayjs(item.workDate).startOf('day');
      const today = dayjs().startOf('day');
      if (itemDate.isBefore(today)) {
        return 'MISSED_CHECK_OUT';
      }
    }
    return item.attendanceStatus;
  };

  // Fetch lookup lists
  useEffect(() => {
    const loadLookupOptions = async () => {
      try {
        const [empRes, deptRes, locRes] = await Promise.all([
          employeeService.getEmployees({ limit: 100 }),
          departmentService.getDepartments({ limit: 100 }),
          workLocationService.getWorkLocations({ limit: 100 })
        ]);
        if (empRes?.success && empRes?.data?.items) {
          setEmployeesOptions(empRes.data.items);
        }
        if (deptRes?.success && deptRes?.data?.items) {
          setDepartmentsOptions(deptRes.data.items);
        }
        if (locRes?.success && locRes?.data?.items) {
          setLocationsOptions(locRes.data.items);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu danh mục', err);
      }
    };
    loadLookupOptions();
  }, []);

  // Fetch attendance list
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        employeeId: employeeId || undefined,
        departmentId: departmentId || undefined,
        locationId: locationId || undefined,
        attendanceStatus: attendanceStatus || undefined,
        reviewStatus: reviewStatus || undefined,
        isOfflineSync: isOfflineSync !== '' ? parseInt(isOfflineSync, 10) : undefined,
      };
      const res = await attendanceService.getAdminAttendance(params);
      if (res?.success && res?.data) {
        const items = (res.data.items || []).map(item => {
          const checkInUrl = item.photos?.checkIn?.photoUrl;
          const checkInVerifyUrl = item.photos?.checkIn?.verificationPhotoUrl;
          const checkOutUrl = item.photos?.checkOut?.photoUrl;
          const checkOutVerifyUrl = item.photos?.checkOut?.verificationPhotoUrl;
          return {
            ...item,
            photos: {
              ...item.photos,
              checkIn: item.photos?.checkIn ? {
                ...item.photos.checkIn,
                photoUrl: getBackendUrl(checkInUrl),
                verificationPhotoUrl: getBackendUrl(checkInVerifyUrl)
              } : null,
              checkOut: item.photos?.checkOut ? {
                ...item.photos.checkOut,
                photoUrl: getBackendUrl(checkOutUrl),
                verificationPhotoUrl: getBackendUrl(checkOutVerifyUrl)
              } : null
            }
          };
        });
        setAttendanceList(items);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải lịch sử chấm công');
    } finally {
      setLoading(false);
    }
  }, [page, limit, fromDate, toDate, employeeId, departmentId, locationId, attendanceStatus, reviewStatus, isOfflineSync, setTotal, toast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setEmployeeId('');
    setDepartmentId('');
    setLocationId('');
    setAttendanceStatus('');
    setReviewStatus('');
    setIsOfflineSync('');
    resetPagination();
  };

  const headers = [
    { key: 'attendanceId', label: 'ID', sortable: false, width: '80px' },
    { key: 'employee', label: 'Nhân viên', sortable: false },
    { key: 'workLocation', label: 'Địa điểm', sortable: false },
    { key: 'checkInTime', label: 'Giờ Check-in', sortable: false, width: '160px' },
    { key: 'checkOutTime', label: 'Giờ Check-out', sortable: false, width: '160px' },
    { key: 'attendanceStatus', label: 'Trạng thái', sortable: false, width: '130px' },
    { key: 'reviewStatus', label: 'Kiểm duyệt', sortable: false, width: '220px' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiActivity className="w-5 h-5 text-primary-600" />
            Lịch sử chấm công hệ thống
          </h1>
          <p className="text-xs text-slate-500">Tra cứu và kiểm soát nhật ký Check-in/Check-out của toàn bộ nhân viên kỹ thuật hiện trường</p>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-4 border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            label="Từ ngày"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); resetPagination(); }}
          />
          <Input
            type="date"
            label="Đến ngày"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); resetPagination(); }}
          />
          <Select
            label="Nhân viên"
            value={employeeId}
            onChange={(e) => { setEmployeeId(e.target.value); resetPagination(); }}
          >
            <option value="">Tất cả</option>
            {employeesOptions.map(emp => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.fullName} ({emp.employeeCode})
              </option>
            ))}
          </Select>
          <Select
            label="Phòng ban"
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); resetPagination(); }}
          >
            <option value="">Tất cả</option>
            {departmentsOptions.map(dept => (
              <option key={dept.departmentId ?? dept.department_id} value={dept.departmentId ?? dept.department_id}>
                {dept.departmentName ?? dept.department_name}
              </option>
            ))}
          </Select>
          <Select
            label="Địa điểm"
            value={locationId}
            onChange={(e) => { setLocationId(e.target.value); resetPagination(); }}
          >
            <option value="">Tất cả</option>
            {locationsOptions.map(loc => (
              <option key={loc.locationId} value={loc.locationId}>
                {loc.locationName}
              </option>
            ))}
          </Select>
          <Select
            label="Trạng thái chấm công"
            value={attendanceStatus}
            onChange={(e) => { setAttendanceStatus(e.target.value); resetPagination(); }}
          >
            <option value="">Tất cả</option>
            <option value="IN_PROGRESS">Đang làm việc (In Progress)</option>
            <option value="COMPLETED">Hoàn thành (Completed)</option>
            <option value="INVALID">Không hợp lệ (Invalid)</option>
            <option value="REVIEW_REQUIRED">Cần kiểm duyệt (Review Required)</option>
          </Select>
          <Select
            label="Kiểm duyệt"
            value={reviewStatus}
            onChange={(e) => { setReviewStatus(e.target.value); resetPagination(); }}
          >
            <option value="">Tất cả</option>
            <option value="NOT_REQUIRED">Không yêu cầu</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </Select>
          <Select
            label="Đồng bộ ngoại tuyến"
            value={isOfflineSync}
            onChange={(e) => { setIsOfflineSync(e.target.value); resetPagination(); }}
          >
            <option value="">Tất cả</option>
            <option value="0">Trực tuyến (Online)</option>
            <option value="1">Ngoại tuyến (Offline)</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 mt-4 border-t pt-3 border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={handleClearFilters} className="flex items-center gap-1">
            Xóa bộ lọc
          </Button>
          <Button variant="primary" size="sm" onClick={fetchAttendance} className="flex items-center gap-1">
            <FiRefreshCw className={loading ? "animate-spin text-xs" : "text-xs"} /> Tải lại
          </Button>
        </div>
      </Card>

      {/* Table Section */}
      <Table
        headers={headers}
        items={attendanceList}
        loading={loading}
        emptyState={
          <Card className="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
            <FiActivity className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Không tìm thấy dữ liệu chấm công</p>
            <p className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc tải lại trang</p>
          </Card>
        }
        renderRow={(item) => (
          <>
            <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
              #{item.attendanceId}
            </td>
            <td className="px-6 py-4">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{item.employee?.fullName}</span>
              <span className="block text-[10px] text-slate-400">{item.employee?.employeeCode} • {item.department?.departmentName}</span>
            </td>
            <td className="px-6 py-4">
              {(() => {
                const locs = item.assignment?.allowedLocations || [];
                if (locs.length > 1) {
                  const allNames = locs.map(l => l.locationName).join(', ');
                  return (
                    <span 
                      className="font-medium text-slate-750 dark:text-slate-200 cursor-help"
                      title={allNames}
                    >
                      {locs[0].locationName}...
                    </span>
                  );
                } else if (locs.length === 1) {
                  return (
                    <span className="font-medium text-slate-750 dark:text-slate-200">
                      {locs[0].locationName}
                    </span>
                  );
                } else {
                  return (
                    <span className="font-medium text-slate-750 dark:text-slate-200">
                      {item.workLocation?.locationName}
                    </span>
                  );
                }
              })()}
              {item.isOfflineSync === 1 && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] bg-amber-50 text-amber-700 border border-amber-100 font-bold uppercase font-sans">
                  Offline
                </span>
              )}
            </td>
            <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
              {item.checkInTime ? dayjs(item.checkInTime).format('HH:mm:ss DD/MM/YYYY') : '—'}
            </td>
            <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
              {item.checkOutTime ? dayjs(item.checkOutTime).format('HH:mm:ss DD/MM/YYYY') : 'N/A'}
            </td>
            <td className="px-6 py-4">
              <StatusBadge value={getAttendanceStatus(item)} type="attendance" />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge value={item.reviewStatus} type="review" />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedAttendance(item)}
                  className="py-1 px-2.5 text-[10px] flex-shrink-0 whitespace-nowrap"
                >
                  Chi tiết
                </Button>
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

      {/* Detail Modal Component */}
      <Modal
        isOpen={!!selectedAttendance}
        onClose={() => setSelectedAttendance(null)}
        title={`Chi tiết chấm công #${selectedAttendance?.attendanceId}`}
        size="xl"
      >
        {selectedAttendance && (
          <div className="space-y-6 text-left">
            {/* Core Info Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Nhân viên & Phòng ban</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedAttendance.employee?.fullName}</p>
                <span className="text-[10px] text-slate-500">{selectedAttendance.employee?.employeeCode} • {selectedAttendance.department?.departmentName}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Địa điểm phân công</span>
                {selectedAttendance.assignment?.allowedLocations && selectedAttendance.assignment.allowedLocations.length > 0 ? (
                  <div className="mt-1 space-y-2 max-h-[80px] overflow-y-auto pr-1">
                    {selectedAttendance.assignment.allowedLocations.map((loc, idx) => (
                      <div key={loc.locationId || idx} className="border-b last:border-b-0 border-slate-200/50 pb-1 last:pb-0">
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{loc.locationName}</p>
                        <span className="text-[9px] text-slate-500 block truncate">{loc.address}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedAttendance.workLocation?.locationName}</p>
                    <span className="text-[10px] text-slate-500 truncate block">{selectedAttendance.workLocation?.address}</span>
                  </>
                )}
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Trạng thái chấm công</span>
                <div className="flex flex-col gap-1 mt-1 items-start">
                  <StatusBadge value={getAttendanceStatus(selectedAttendance)} type="attendance" />
                  <span className="text-[9px] text-slate-550">Kiểm duyệt: <strong>{selectedAttendance.reviewStatus}</strong></span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2.5 text-xs font-bold uppercase border-b-2 transition-all ${
                  activeTab === 'info'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                Thông tin chung
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2.5 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'photos'
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                Lịch sử ảnh ({attendancePhotos.length})
              </button>
            </div>

            {activeTab === 'info' && (
              <>
                {/* Shift & Timekeeping calculations */}
                {selectedAttendance.shiftId && (
                  <div className="p-5 rounded-2xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10 space-y-4">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 border-b pb-2 flex items-center gap-1.5 uppercase">
                      <FiClock className="text-primary-600" />
                      Thông tin Ca làm việc & Công thực tế
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block uppercase">Giờ quy định (Ca)</span>
                        <strong className="text-slate-700 dark:text-slate-350">
                          {selectedAttendance.scheduledStartTime ? dayjs(selectedAttendance.scheduledStartTime).format('HH:mm') : '—'}
                          {' - '}
                          {selectedAttendance.scheduledEndTime ? dayjs(selectedAttendance.scheduledEndTime).format('HH:mm') : '—'}
                        </strong>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block uppercase">Đi trễ</span>
                        {!selectedAttendance.scheduledStartTime ? (
                          <strong className="text-slate-400">N/A</strong>
                        ) : selectedAttendance.checkInStatus === 'LATE' ? (
                          <strong className="text-rose-600 font-bold">Trễ {selectedAttendance.lateMinutes} phút</strong>
                        ) : selectedAttendance.checkInStatus === 'ON_TIME' ? (
                          <strong className="text-emerald-600">Đúng giờ</strong>
                        ) : (
                          <strong className="text-slate-400">N/A</strong>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block uppercase">Về sớm / Tăng ca</span>
                        {!selectedAttendance.scheduledEndTime ? (
                          <strong className="text-slate-400">N/A</strong>
                        ) : selectedAttendance.checkOutTime ? (
                          <>
                            {selectedAttendance.checkOutStatus === 'LEFT_EARLY' && (
                              <strong className="text-rose-600 font-bold">Về sớm {selectedAttendance.earlyLeaveMinutes} phút</strong>
                            )}
                            {selectedAttendance.checkOutStatus === 'OVERTIME' && (
                              <strong className="text-indigo-600 font-bold">Tăng ca {selectedAttendance.overtimeMinutes} phút</strong>
                            )}
                            {selectedAttendance.checkOutStatus === 'ON_TIME' && (
                              <strong className="text-emerald-600">Đúng giờ</strong>
                            )}
                            {!selectedAttendance.checkOutStatus && (
                              <strong className="text-slate-400">N/A</strong>
                            )}
                          </>
                        ) : (
                          <strong className="text-slate-400">N/A</strong>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block uppercase">Tổng giờ làm thực tế</span>
                        <strong className="text-slate-700 dark:text-slate-350">
                          {selectedAttendance.checkOutTime ? (
                            <>
                              {selectedAttendance.workedMinutes ? `${Math.floor(selectedAttendance.workedMinutes / 60)}h ${selectedAttendance.workedMinutes % 60}m` : '0 phút'}
                              {` (${selectedAttendance.workedMinutes || 0} phút)`}
                            </>
                          ) : 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Check-in vs Check-out Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Check-in Details */}
                  <div className="space-y-4 p-5 rounded-2xl border border-slate-150 dark:border-slate-850">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 border-b pb-2 flex items-center gap-1.5 uppercase">
                      <FiCompass className="text-primary-600" />
                      Chi tiết Check-in
                    </h4>

                    {/* Photos */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-455 font-semibold">Ảnh check-in</span>
                        <div className="relative group rounded-xl overflow-hidden border bg-slate-100 flex items-center justify-center h-40">
                          {selectedAttendance.photos?.checkIn?.photoUrl ? (
                            <>
                              <img
                                src={selectedAttendance.photos.checkIn.photoUrl}
                                alt="Check-in Face"
                                className="w-full h-full object-cover z-10"
                              />
                              <div className="absolute inset-0 bg-black/55 z-20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setZoomPhoto(selectedAttendance.photos.checkIn.photoUrl)}
                                  className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200"
                                >
                                  Xem ảnh
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-350 z-10">Không có ảnh chụp</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-455 font-semibold">Ảnh xác thực check-in</span>
                        <div className="relative group rounded-xl overflow-hidden border bg-slate-100 flex items-center justify-center h-40">
                          {selectedAttendance.photos?.checkIn?.verificationPhotoUrl ? (
                            <>
                              <img
                                src={selectedAttendance.photos.checkIn.verificationPhotoUrl}
                                alt="Check-in Verification"
                                className="w-full h-full object-cover z-10"
                              />
                              <div className="absolute inset-0 bg-black/55 z-20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setZoomPhoto(selectedAttendance.photos.checkIn.verificationPhotoUrl)}
                                  className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200"
                                >
                                  Xem ảnh
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-350 z-10">Không có ảnh chụp</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-455">
                      <span>Chụp lúc: {selectedAttendance.photos?.checkIn?.captureTime ? dayjs(selectedAttendance.photos.checkIn.captureTime).format('HH:mm:ss DD/MM/YYYY') : 'N/A'}</span>
                      <span>Dung lượng: {selectedAttendance.photos?.checkIn?.imageSize || 'N/A'}</span>
                    </div>

                    {/* GPS Grid Info */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-455 font-semibold">Thông tin GPS Check-in</span>
                      {selectedAttendance.gps?.checkIn ? (
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Vĩ độ (Lat)</span>
                            <strong>{selectedAttendance.gps.checkIn.latitude}</strong>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Kinh độ (Lng)</span>
                            <strong>{selectedAttendance.gps.checkIn.longitude}</strong>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Độ chính xác GPS</span>
                            <strong>{selectedAttendance.gps.checkIn.gpsAccuracy} m</strong>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Sai lệch Geofence</span>
                            <strong className={selectedAttendance.gps.checkIn.validationResult === 'ACCEPTED' ? "text-emerald-600" : "text-rose-600"}>
                              {selectedAttendance.gps.checkIn.distanceToWorkLocation !== null ? `${selectedAttendance.gps.checkIn.distanceToWorkLocation.toFixed(1)} m` : '0 m'}
                              ({selectedAttendance.gps.checkIn.validationResult === 'ACCEPTED' ? 'Đạt' : 'Không đạt'})
                            </strong>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg col-span-2">
                            <span className="text-[8px] text-slate-400 block uppercase font-sans">Địa điểm / Nơi Check-in thực tế</span>
                            <strong className="text-primary-655 dark:text-primary-400 font-bold block text-xs mt-0.5">
                              📍 {selectedAttendance.workLocation?.matchedLocationName || selectedAttendance.workLocation?.locationName || (selectedAttendance.assignment?.allowedLocations && selectedAttendance.assignment.allowedLocations.length > 0 ? selectedAttendance.assignment.allowedLocations.map(l => l.locationName).join(', ') : 'Theo tọa độ GPS')}
                            </strong>
                            {selectedAttendance.workLocation?.address && (
                              <span className="text-[9px] text-slate-500 block truncate mt-0.5">{selectedAttendance.workLocation.address}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-455 italic">Không có dữ liệu GPS</p>
                      )}
                    </div>

                    {/* Face Verification Info */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-455 font-semibold">Nhận diện Khuôn mặt (Face Recognition)</span>
                      {selectedAttendance.faceVerification?.checkIn?.verificationResult && selectedAttendance.faceVerification.checkIn.verificationResult !== 'NOT_REQUIRED' ? (
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Kết quả khớp</span>
                            <strong className={selectedAttendance.faceVerification.checkIn.status === 'SUCCESS' ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                              {selectedAttendance.faceVerification.checkIn.verificationResult}
                            </strong>
                          </div>
                          <div className="p-2 bg-slate-55 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Độ tương đồng</span>
                            <strong>
                              {selectedAttendance.faceVerification.checkIn.similarityScore !== null ? selectedAttendance.faceVerification.checkIn.similarityScore.toFixed(3) : 'N/A'}
                              (Min: {selectedAttendance.faceVerification.checkIn.threshold})
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-455 italic">Không áp dụng xác thực khuôn mặt</p>
                      )}
                    </div>

                    {/* WebAuthn Credentials Info */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-455 font-semibold">Xác thực Sinh trắc WebAuthn</span>
                      {selectedAttendance.webauthn?.checkIn?.credentialName && selectedAttendance.webauthn.checkIn.credentialName !== 'Not Used' ? (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-[10px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Thiết bị xác thực:</span>
                            <strong>{selectedAttendance.webauthn.checkIn.credentialName}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Resident Key:</span>
                            <strong>{selectedAttendance.webauthn.checkIn.residentKey}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">User Verification:</span>
                            <strong>{selectedAttendance.webauthn.checkIn.userVerification}</strong>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-455 italic">Không áp dụng sinh trắc WebAuthn</p>
                      )}
                    </div>
                  </div>

                  {/* Check-out Details */}
                  <div className="space-y-4 p-5 rounded-2xl border border-slate-150 dark:border-slate-850">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 border-b pb-2 flex items-center gap-1.5 uppercase">
                      <FiCompass className="text-primary-600" />
                      Chi tiết Check-out
                    </h4>

                    {/* Photos */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-455 font-semibold">Ảnh check-out</span>
                        <div className="relative group rounded-xl overflow-hidden border bg-slate-100 flex items-center justify-center h-40">
                          {selectedAttendance.photos?.checkOut?.photoUrl ? (
                            <>
                              <img
                                src={selectedAttendance.photos.checkOut.photoUrl}
                                alt="Check-out Face"
                                className="w-full h-full object-cover z-10"
                              />
                              <div className="absolute inset-0 bg-black/55 z-20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setZoomPhoto(selectedAttendance.photos.checkOut.photoUrl)}
                                  className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200"
                                >
                                  Xem ảnh
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-350 z-10">Chưa thực hiện check-out</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-455 font-semibold">Ảnh xác thực check-out</span>
                        <div className="relative group rounded-xl overflow-hidden border bg-slate-100 flex items-center justify-center h-40">
                          {selectedAttendance.photos?.checkOut?.verificationPhotoUrl ? (
                            <>
                              <img
                                src={selectedAttendance.photos.checkOut.verificationPhotoUrl}
                                alt="Check-out Verification"
                                className="w-full h-full object-cover z-10"
                              />
                              <div className="absolute inset-0 bg-black/55 z-20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setZoomPhoto(selectedAttendance.photos.checkOut.verificationPhotoUrl)}
                                  className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200"
                                >
                                  Xem ảnh
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-350 z-10">Chưa thực hiện check-out</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-455">
                      <span>Chụp lúc: {selectedAttendance.photos?.checkOut?.captureTime ? dayjs(selectedAttendance.photos.checkOut.captureTime).format('HH:mm:ss DD/MM/YYYY') : 'N/A'}</span>
                      <span>Dung lượng: {selectedAttendance.photos?.checkOut?.imageSize || 'N/A'}</span>
                    </div>

                    {/* GPS Info */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-455 font-semibold">Thông tin GPS Check-out</span>
                      {selectedAttendance.gps?.checkOut ? (
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Vĩ độ (Lat)</span>
                            <strong>{selectedAttendance.gps.checkOut.latitude}</strong>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Kinh độ (Lng)</span>
                            <strong>{selectedAttendance.gps.checkOut.longitude}</strong>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Độ chính xác GPS</span>
                            <strong>{selectedAttendance.gps.checkOut.gpsAccuracy} m</strong>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Sai lệch Geofence</span>
                            <strong className={selectedAttendance.gps.checkOut.validationResult === 'ACCEPTED' ? "text-emerald-600" : "text-rose-600"}>
                              {selectedAttendance.gps.checkOut.distanceToWorkLocation !== null ? `${selectedAttendance.gps.checkOut.distanceToWorkLocation.toFixed(1)} m` : '0 m'}
                              ({selectedAttendance.gps.checkOut.validationResult === 'ACCEPTED' ? 'Đạt' : 'Không đạt'})
                            </strong>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg col-span-2">
                            <span className="text-[8px] text-slate-400 block uppercase font-sans">Địa điểm / Nơi Check-out thực tế</span>
                            <strong className="text-primary-655 dark:text-primary-400 font-bold block text-xs mt-0.5">
                              📍 {selectedAttendance.workLocation?.matchedLocationName || selectedAttendance.workLocation?.locationName || (selectedAttendance.assignment?.allowedLocations && selectedAttendance.assignment.allowedLocations.length > 0 ? selectedAttendance.assignment.allowedLocations.map(l => l.locationName).join(', ') : 'Theo tọa độ GPS')}
                            </strong>
                            {selectedAttendance.workLocation?.address && (
                              <span className="text-[9px] text-slate-500 block truncate mt-0.5">{selectedAttendance.workLocation.address}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-455 italic">Chưa thực hiện check-out</p>
                      )}
                    </div>

                    {/* Face Verification Info */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-455 font-semibold">Nhận diện Khuôn mặt (Face Recognition)</span>
                      {selectedAttendance.faceVerification?.checkOut?.verificationResult && selectedAttendance.faceVerification.checkOut.verificationResult !== 'NOT_REQUIRED' ? (
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Kết quả khớp</span>
                            <strong className={selectedAttendance.faceVerification.checkOut.status === 'SUCCESS' ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                              {selectedAttendance.faceVerification.checkOut.verificationResult}
                            </strong>
                          </div>
                          <div className="p-2 bg-slate-55 dark:bg-slate-900 border rounded-lg">
                            <span className="text-[8px] text-slate-400 block uppercase">Độ tương đồng</span>
                            <strong>
                              {selectedAttendance.faceVerification.checkOut.similarityScore !== null ? selectedAttendance.faceVerification.checkOut.similarityScore.toFixed(3) : 'N/A'}
                              (Min: {selectedAttendance.faceVerification.checkOut.threshold})
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-455 italic">Không áp dụng xác thực khuôn mặt</p>
                      )}
                    </div>

                    {/* WebAuthn Credentials Info */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-455 font-semibold">Xác thực Sinh trắc WebAuthn</span>
                      {selectedAttendance.webauthn?.checkOut?.credentialName && selectedAttendance.webauthn.checkOut.credentialName !== 'Not Used' ? (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-[10px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Thiết bị xác thực:</span>
                            <strong>{selectedAttendance.webauthn.checkOut.credentialName}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Resident Key:</span>
                            <strong>{selectedAttendance.webauthn.checkOut.residentKey}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">User Verification:</span>
                            <strong>{selectedAttendance.webauthn.checkOut.userVerification}</strong>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-455 italic">Không áp dụng sinh trắc WebAuthn</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overtime Attendance Section */}
                {selectedAttendance.overtimeSessions && selectedAttendance.overtimeSessions.length > 0 && (
                  <div className="p-5 border rounded-2xl border-slate-150 dark:border-slate-850 space-y-4 bg-amber-50/15 dark:bg-amber-950/5">
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 border-b pb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <FiClock className="text-amber-600" />
                      Thông tin Chấm công Tăng ca (Overtime)
                    </h4>
                    <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedAttendance.overtimeSessions.map((session, idx) => (
                        <div key={session.attendanceOtId || idx} className="pt-3 first:pt-0 space-y-3">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              Phiên tăng ca #{session.attendanceOtId} ({session.locationName})
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              session.attendanceStatus === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {session.attendanceStatus === 'COMPLETED' ? 'Hoàn thành' : 'Đang làm việc'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Giờ Check-in OT</span>
                              <strong>{session.checkInTime ? dayjs(session.checkInTime).format('HH:mm:ss DD/MM/YYYY') : '—'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Giờ Check-out OT</span>
                              <strong>{session.checkOutTime ? dayjs(session.checkOutTime).format('HH:mm:ss DD/MM/YYYY') : 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Thời gian thực tế</span>
                              <strong>{session.actualMinutes !== null && session.actualMinutes !== undefined ? `${session.actualMinutes} phút` : 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Thời gian được duyệt</span>
                              <strong className="text-amber-605 dark:text-amber-400 font-bold">{session.approvedMinutes !== null && session.approvedMinutes !== undefined ? `${session.approvedMinutes} phút` : 'N/A'}</strong>
                            </div>
                          </div>

                          {/* Photos & Distances */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            {session.checkInPhotoUrl && (
                              <div className="flex items-center gap-3 p-2 border rounded-xl bg-white dark:bg-slate-900">
                                <img
                                  src={getBackendUrl(session.checkInPhotoUrl)}
                                  alt="Check-in OT Photo"
                                  className="w-12 h-12 object-cover rounded-lg border flex-shrink-0 cursor-pointer"
                                  onClick={() => setZoomPhoto(getBackendUrl(session.checkInPhotoUrl))}
                                />
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase">Check-in Photo</span>
                                  <span className="text-[10px] text-slate-500 font-semibold block">Sai lệch: {session.checkInDistanceMeter ? `${Number(session.checkInDistanceMeter).toFixed(1)}m` : '0m'}</span>
                                </div>
                              </div>
                            )}
                            {session.checkOutPhotoUrl && (
                              <div className="flex items-center gap-3 p-2 border rounded-xl bg-white dark:bg-slate-900">
                                <img
                                  src={getBackendUrl(session.checkOutPhotoUrl)}
                                  alt="Check-out OT Photo"
                                  className="w-12 h-12 object-cover rounded-lg border flex-shrink-0 cursor-pointer"
                                  onClick={() => setZoomPhoto(getBackendUrl(session.checkOutPhotoUrl))}
                                />
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase">Check-out Photo</span>
                                  <span className="text-[10px] text-slate-500 font-semibold block">Sai lệch: {session.checkOutDistanceMeter ? `${Number(session.checkOutDistanceMeter).toFixed(1)}m` : '0m'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client Device Details & Server Time Difference details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Device metadata */}
                  <div className="p-5 border rounded-2xl border-slate-150 dark:border-slate-850 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Thiết bị chấm công (Client Device Info)</h4>
                    <div className="text-[10px] space-y-2">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Hệ điều hành:</span>
                        <strong className="text-slate-700 dark:text-slate-300">{selectedAttendance.device?.operatingSystem}</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Trình duyệt Web:</span>
                        <strong className="text-slate-700 dark:text-slate-300">{selectedAttendance.device?.browser}</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Platform gốc:</span>
                        <strong className="text-slate-700 dark:text-slate-300">{selectedAttendance.device?.platform}</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Chế độ vận hành:</span>
                        <strong className="text-slate-700 dark:text-slate-300">{selectedAttendance.device?.pwaMode}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fingerprint Thiết bị:</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-mono text-[9px]">{selectedAttendance.device?.fingerprint}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Server Clock Sync */}
                  <div className="p-5 border rounded-2xl border-slate-150 dark:border-slate-850 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Đồng bộ Thời gian máy chủ (Time Sync)</h4>
                    <div className="text-[10px] space-y-2">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Thời gian Server ghi nhận:</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-mono">
                          {selectedAttendance.serverInfo?.serverTime ? dayjs(selectedAttendance.serverInfo.serverTime).format('HH:mm:ss DD/MM/YYYY') : 'N/A'}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Thời gian Client yêu cầu:</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-mono">
                          {selectedAttendance.serverInfo?.clientTime ? dayjs(selectedAttendance.serverInfo.clientTime).format('HH:mm:ss DD/MM/YYYY') : 'N/A'}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Độ lệch thời gian (Client vs Server):</span>
                        <strong className="text-emerald-655 font-mono">{selectedAttendance.serverInfo?.timeDifferenceSeconds} giây (Hợp lệ)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trạng thái Time Server nội bộ:</span>
                        <strong className="text-emerald-655 uppercase font-semibold">{selectedAttendance.serverInfo?.timeServerStatus}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-6">
                {loadingPhotos ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="text-xs text-slate-400">Đang tải danh sách ảnh...</span>
                  </div>
                ) : attendancePhotos.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-400">Không tìm thấy ảnh chấm công nào cho ca làm việc này.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {attendancePhotos.map((photo) => (
                      <div
                        key={photo.photoId}
                        className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/5 hover:shadow-md transition-all duration-300"
                      >
                        {/* Image Thumbnail Box */}
                        <div className="relative group w-full sm:w-36 h-36 rounded-xl overflow-hidden border bg-slate-100 flex-shrink-0 flex items-center justify-center">
                          <img
                            src={getBackendUrl(photo.photoUrl)}
                            alt={photo.photoType}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setZoomPhoto(getBackendUrl(photo.photoUrl))}
                              className="px-3 py-1.5 text-[10px] bg-slate-50 text-slate-800 rounded-lg font-bold hover:bg-white shadow transition-all duration-200"
                            >
                              Phóng to
                            </button>
                          </div>
                        </div>

                        {/* Metadata details */}
                        <div className="flex-1 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="text-slate-400 font-medium">Loại ảnh:</span>
                            <span className="font-bold text-primary-605 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded text-[9px]">
                              {photo.photoType}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-400">Thời gian chụp:</span>
                            <span className="font-mono text-[10px] text-slate-700 dark:text-slate-350">
                              {photo.capturedAt ? dayjs(photo.capturedAt).format('HH:mm:ss DD/MM/YYYY') : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-400">Thời gian tải lên:</span>
                            <span className="font-mono text-[10px] text-slate-700 dark:text-slate-350">
                              {photo.uploadedAt ? dayjs(photo.uploadedAt).format('HH:mm:ss DD/MM/YYYY') : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-400">Dung lượng:</span>
                            <span className="text-slate-750 dark:text-slate-300 font-semibold">
                              {photo.fileSize ? `${(photo.fileSize / 1024).toFixed(1)} KB` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-400">Độ phân giải:</span>
                            <span className="text-slate-700 dark:text-slate-350">
                              {photo.imageWidth && photo.imageHeight ? `${photo.imageWidth} x ${photo.imageHeight}` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-400">GPS Accuracy:</span>
                            <span className="text-slate-700 dark:text-slate-350">
                              {photo.gpsAccuracy ? `${photo.gpsAccuracy} m` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-slate-400">Khoảng cách GPS:</span>
                            <span className="text-slate-700 dark:text-slate-350 font-semibold">
                              {photo.gpsDistance !== null ? `${photo.gpsDistance.toFixed(1)} m` : '—'}
                            </span>
                          </div>
                          {photo.faceConfidence !== null && (
                            <div className="flex justify-between border-b pb-1">
                              <span className="text-slate-400">Độ khớp khuôn mặt:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {(photo.faceConfidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {photo.livenessScore !== null && (
                            <div className="flex justify-between border-b pb-1">
                              <span className="text-slate-400">Liveness Score:</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {photo.livenessScore.toFixed(3)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Nguồn lưu trữ:</span>
                            <span className="text-slate-500 uppercase font-mono text-[9px]">
                              {photo.cloudProvider || 'LOCAL'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Back button */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setSelectedAttendance(null)}>
                Đóng chi tiết
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Picture Zoom Overlay Modal */}
      <Modal
        isOpen={!!zoomPhoto}
        onClose={() => setZoomPhoto(null)}
        title="Xem ảnh phóng to"
        size="lg"
      >
        <div className="flex items-center justify-center p-2">
          {zoomPhoto && (
            <img
              src={zoomPhoto}
              alt="Zoomed Verification"
              className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl border"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
