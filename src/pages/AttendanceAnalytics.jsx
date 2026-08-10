import React, { useState, useEffect } from 'react';
import {
  FiSearch, FiCalendar, FiClock, FiActivity, FiUser,
  FiAlertCircle, FiCheck, FiInfo, FiChevronRight,
  FiEye, FiArrowLeft, FiDownload
} from 'react-icons/fi';
import { RiTimerLine, RiBarChart2Line } from 'react-icons/ri';
import dayjs from 'dayjs';
import { employeeService } from '../services/employeeService';
import api from '../services/api';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';

export const AttendanceAnalytics = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState('current'); // 'current' or 'previous'

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [expandedLate, setExpandedLate] = useState(false);
  const [expandedEarly, setExpandedEarly] = useState(false);
  const [expandedAbsent, setExpandedAbsent] = useState(false);

  // Fetch employees list
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await employeeService.getEmployees({ limit: 100 });
        if (res && res.success && res.data) {
          const empList = res.data.items || [];
          setEmployees(empList);
          if (empList.length > 0) {
            setSelectedEmployee(empList[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch analytics when selected employee or date range changes
  useEffect(() => {
    if (!selectedEmployee) return;

    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        let start, end;
        if (analyticsRange === 'current') {
          start = dayjs().startOf('month').format('YYYY-MM-DD');
          end = dayjs().endOf('month').format('YYYY-MM-DD');
        } else {
          start = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
          end = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
        }

        const res = await api.get('/v1/attendance/analytics', {
          params: {
            employeeId: selectedEmployee.employeeId,
            startDate: start,
            endDate: end
          }
        });

        if (res && res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Error fetching employee analytics:', err);
        setAnalytics(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [selectedEmployee, analyticsRange]);

  // Filter employees based on search query
  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
      case 'LATE':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      case 'EARLY_LEAVE':
        return 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-250 dark:border-yellow-900/30';
      case 'ABSENT':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 border border-rose-200 dark:border-rose-900/30';
      case 'PENDING':
        return 'bg-slate-50 text-slate-650 dark:bg-slate-800/40 dark:text-slate-400 border border-slate-200 dark:border-slate-800/40';
      default:
        return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'PRESENT': return 'Đúng giờ';
      case 'LATE': return 'Đi muộn';
      case 'EARLY_LEAVE': return 'Về sớm';
      case 'ABSENT': return 'Vắng mặt';
      case 'PENDING': return 'Sắp tới';
      case 'OFF': return 'Nghỉ';
      default: return status;
    }
  };

  const getLateMinutes = (day) => {
    if (day.status !== 'LATE') return 0;
    if (day.lateMinutes !== undefined && day.lateMinutes !== null) {
      return day.lateMinutes;
    }
    // Try to parse from shiftName if available, e.g. "Ca Sáng (08:00 - 12:00)"
    if (day.checkInTime && day.shiftName) {
      const timeMatch = day.shiftName.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        const [_, shiftH, shiftM] = timeMatch;
        const [checkInH, checkInM] = day.checkInTime.split(':').map(Number);
        const shiftStartMins = Number(shiftH) * 60 + Number(shiftM);
        const checkInMins = checkInH * 60 + checkInM;
        if (checkInMins > shiftStartMins) {
          return checkInMins - shiftStartMins;
        }
      }
    }
    // Default mock/fallback if status is LATE but we can't parse
    // TODO: Replace with backend lateMinutes once API is upgraded
    return 15;
  };

  const getEarlyLeaveMinutes = (day) => {
    if (day.status !== 'EARLY_LEAVE') return 0;
    if (day.earlyLeaveMinutes !== undefined && day.earlyLeaveMinutes !== null) {
      return day.earlyLeaveMinutes;
    }
    // Try to parse from shiftName if available, e.g. "Ca Sáng (08:00 - 12:00)"
    if (day.checkOutTime && day.shiftName) {
      const times = day.shiftName.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
      if (times && times[3] && times[4]) {
        const shiftEndMins = Number(times[3]) * 60 + Number(times[4]);
        const [checkOutH, checkOutM] = day.checkOutTime.split(':').map(Number);
        const checkOutMins = checkOutH * 60 + checkOutM;
        if (shiftEndMins > checkOutMins) {
          return shiftEndMins - checkOutMins;
        }
      }
    }
    // Default mock/fallback if status is EARLY_LEAVE but we can't parse
    // TODO: Replace with backend earlyLeaveMinutes once API is upgraded
    return 15;
  };

  const handleExportCSV = () => {
    if (!analytics || !selectedEmployee) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

    const onTime = analytics.summary.totalOnTime;
    const late = analytics.dailyData.filter(d => d.status === 'LATE').length;
    const early = analytics.dailyData.filter(d => d.status === 'EARLY_LEAVE').length;
    const abs = analytics.summary.absent;
    const total = onTime + late + early + abs || 1;
    const totalLateMinutes = analytics.summary.totalLateMinutes ?? analytics.dailyData.reduce((sum, d) => sum + getLateMinutes(d), 0);
    const totalEarlyLeaveMinutes = analytics.summary.totalEarlyLeaveMinutes ?? analytics.dailyData.reduce((sum, d) => sum + getEarlyLeaveMinutes(d), 0);

    // 1. THÔNG TIN NHÂN VIÊN & BÁO CÁO
    csvContent += `THÔNG TIN NHÂN VIÊN & KỲ BÁO CÁO\n`;
    csvContent += `Họ và tên:,${selectedEmployee.fullName}\n`;
    csvContent += `Mã nhân viên:,${selectedEmployee.employeeCode}\n`;
    csvContent += `Phòng ban:,${selectedEmployee.departmentName || 'Kỹ thuật'}\n`;
    csvContent += `Tháng báo cáo:,${analyticsRange === 'current' ? 'Tháng này' : 'Tháng trước'}\n\n`;

    // 2. CHỈ SỐ THỐNG KÊ TỔNG HỢP
    csvContent += `CHỈ SỐ THỐNG KÊ CHUYÊN CẦN\n`;
    csvContent += `Chỉ số,Giá trị\n`;
    csvContent += `Tổng số ca được phân công,${total} ca\n`;
    csvContent += `Tổng giờ công thực tế,${analytics.summary.totalWorkingHours} giờ\n`;
    csvContent += `Tỷ lệ hoàn thành công,${analytics.summary.attendanceRate}%\n`;
    csvContent += `Số ca đi đúng giờ,${onTime} ca\n`;
    csvContent += `Số lần đi muộn,${late} lần\n`;
    csvContent += `Tổng số phút đi muộn,${totalLateMinutes} phút\n`;
    csvContent += `Số lần về sớm,${early} lần\n`;
    csvContent += `Tổng số phút về sớm,${totalEarlyLeaveMinutes} phút\n`;
    csvContent += `Số ca vắng mặt,${abs} ca\n\n`;

    // 3. DANH SÁCH CHI TIẾT LỆCH GIỜ & VẮNG MẶT
    csvContent += `DANH SÁCH ĐI MUỘN CHI TIẾT\n`;
    csvContent += `Ngày,Số phút đi muộn\n`;
    const lateDays = analytics.dailyData.filter(d => d.status === 'LATE');
    if (lateDays.length === 0) {
      csvContent += `Không có lần đi muộn nào,-\n`;
    } else {
      lateDays.forEach(day => {
        csvContent += `${dayjs(day.date).format('DD/MM/YYYY')},${getLateMinutes(day)} phút\n`;
      });
    }
    csvContent += `\n`;

    csvContent += `DANH SÁCH VỀ SỚM CHI TIẾT\n`;
    csvContent += `Ngày,Số phút về sớm\n`;
    const earlyLeaveDays = analytics.dailyData.filter(d => d.status === 'EARLY_LEAVE');
    if (earlyLeaveDays.length === 0) {
      csvContent += `Không có lần về sớm nào,-\n`;
    } else {
      earlyLeaveDays.forEach(day => {
        csvContent += `${dayjs(day.date).format('DD/MM/YYYY')},${getEarlyLeaveMinutes(day)} phút\n`;
      });
    }
    csvContent += `\n`;

    csvContent += `DANH SÁCH NGÀY VẮNG MẶT\n`;
    csvContent += `Ngày,Ghi chú\n`;
    const absentDays = analytics.dailyData.filter(d => d.status === 'ABSENT');
    if (absentDays.length === 0) {
      csvContent += `Không có ngày vắng mặt nào,-\n`;
    } else {
      absentDays.forEach(day => {
        csvContent += `${dayjs(day.date).format('DD/MM/YYYY')},Không Check-in\n`;
      });
    }
    csvContent += `\n`;

    // 4. NHẬT KÝ CÔNG CHI TIẾT THEO NGÀY
    csvContent += `NHẬT KÝ CÔNG CHI TIẾT THEO NGÀY\n`;
    csvContent += `Ngày,Thứ,Trạng thái,Ca làm,Giờ Check-in,Giờ Check-out,Số phút đi muộn,Số phút về sớm,Giờ công\n`;
    analytics.dailyData.forEach(day => {
      const dateStr = dayjs(day.date).format('DD/MM/YYYY');
      const dayOfWeek = dayjs(day.date).format('dddd');
      const statusText = translateStatus(day.status);
      const shift = day.shiftName || 'Không có ca';
      const checkIn = day.checkInTime || '-';
      const checkOut = day.checkOutTime || '-';
      const lateM = day.status === 'LATE' ? getLateMinutes(day) : 0;
      const earlyM = day.status === 'EARLY_LEAVE' ? getEarlyLeaveMinutes(day) : 0;
      const hours = `${day.workingHours}h`;

      csvContent += `"${dateStr}","${dayOfWeek}","${statusText}","${shift}","${checkIn}","${checkOut}",${lateM},${earlyM},"${hours}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bao_cao_cong_chi_tiet_${selectedEmployee.employeeCode}_${analyticsRange === 'current' ? 'thang_nay' : 'thang_truoc'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upgraded parameters for charts and accordion
  const onTime = analytics ? analytics.summary.totalOnTime : 0;
  const late = analytics ? analytics.dailyData.filter(d => d.status === 'LATE').length : 0;
  const early = analytics ? analytics.dailyData.filter(d => d.status === 'EARLY_LEAVE').length : 0;
  const abs = analytics ? analytics.summary.absent : 0;
  const pending = analytics ? (analytics.summary.pendingShift || 0) : 0;
  const total = analytics ? (analytics.summary.totalAssigned || 1) : 1;
  const totalLateMinutes = analytics ? (analytics.summary.totalLateMinutes ?? analytics.dailyData.reduce((sum, d) => sum + getLateMinutes(d), 0)) : 0;
  const totalEarlyLeaveMinutes = analytics ? (analytics.summary.totalEarlyLeaveMinutes ?? analytics.dailyData.reduce((sum, d) => sum + getEarlyLeaveMinutes(d), 0)) : 0;

  const pctOnTime = analytics ? Math.round((onTime / total) * 100) : 0;
  const pctLate = analytics ? Math.round((late / total) * 100) : 0;
  const pctEarly = analytics ? Math.round((early / total) * 100) : 0;
  const pctAbs = analytics ? Math.round((abs / total) * 100) : 0;
  const pctPending = analytics ? Math.round((pending / total) * 100) : 0;

  const hasData = analytics ? (total > 0) : false;

  const doughnutSegments = analytics ? [
    { label: 'Đúng giờ', val: onTime, pct: (onTime / total) * 100, displayPct: pctOnTime, strokeColor: '#10b981', colorClass: 'bg-emerald-500' },
    { label: 'Đi muộn', val: late, pct: (late / total) * 100, displayPct: pctLate, strokeColor: '#f59e0b', colorClass: 'bg-amber-500' },
    { label: 'Về sớm', val: early, pct: (early / total) * 100, displayPct: pctEarly, strokeColor: '#3b82f6', colorClass: 'bg-blue-500' },
    { label: 'Vắng', val: abs, pct: (abs / total) * 100, displayPct: pctAbs, strokeColor: '#ef4444', colorClass: 'bg-red-500' },
    { label: 'Sắp tới', val: pending, pct: (pending / total) * 100, displayPct: pctPending, strokeColor: '#94a3b8', colorClass: 'bg-slate-400' },
  ].filter(s => s.val > 0) : [];

  if (!showDetail) {
    return (
      <div className="flex flex-col gap-6 h-[calc(100vh-140px)] overflow-hidden text-left">
        {/* Header containing title and search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <RiBarChart2Line className="w-5 h-5 text-primary-600" />
              Báo cáo nhân viên
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Phân tích chuyên cần, số giờ công thực tế và nhật ký chấm công chi tiết của từng nhân sự
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Scrollable list of cards */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loadingEmployees ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-5 flex flex-col justify-between border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                      <Skeleton className="h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Skeleton className="h-8 w-24 rounded-xl" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
              <FiInfo className="w-6 h-6 text-slate-300" />
              <span>Không tìm thấy nhân viên phù hợp</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4 animate-fadeIn">
              {filteredEmployees.map((emp) => (
                <Card
                  key={emp.employeeId}
                  className="flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:shadow-md hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-all duration-200 rounded-2xl group text-left"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400 flex items-center justify-center text-sm font-extrabold shrink-0">
                      {emp.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-655 transition-colors">
                        {emp.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 font-semibold">
                        Mã NV: {emp.employeeCode}
                      </span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 truncate">
                        Phòng ban: {emp.departmentName || 'Kỹ thuật'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-150/60 dark:border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setShowDetail(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-750 dark:text-primary-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white text-xs font-bold transition-all duration-150 cursor-pointer"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      Xem chi tiết
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] overflow-hidden text-left animate-fadeIn">
      {/* Header containing back button */}
      <div className="flex-shrink-0">
        <button
          onClick={() => {
            setShowDetail(false);
            setExpandedLate(false);
            setExpandedEarly(false);
            setExpandedAbsent(false);
          }}
          className="inline-flex items-center gap-2 text-slate-650 dark:text-slate-350 hover:text-slate-800 dark:hover:text-slate-100 transition-colors font-bold text-xs cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <span>← Danh sách nhân viên</span>
        </button>
      </div>

      {/* Right Panel: Cumulative stats detail */}
      <Card className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 p-6 h-full overflow-hidden">
        {selectedEmployee ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-150 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-slate-850 text-primary-750 dark:text-primary-400 flex items-center justify-center text-lg font-black shrink-0">
                  <FiUser />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-100">{selectedEmployee.fullName}</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Mã nhân viên: <span className="text-slate-650 dark:text-slate-300">{selectedEmployee.employeeCode}</span> • Phòng ban: <span className="text-slate-650 dark:text-slate-300">{selectedEmployee.departmentName || 'Kỹ thuật'}</span>
                  </p>
                </div>
              </div>

              {/* Range toggle selection + Export button */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-850 p-1 select-none">
                  <button
                    onClick={() => setAnalyticsRange('current')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${analyticsRange === 'current'
                        ? 'bg-white dark:bg-slate-900 text-primary-650 dark:text-primary-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-950 dark:hover:text-slate-100'
                      }`}
                  >
                    Tháng này
                  </button>
                  <button
                    onClick={() => setAnalyticsRange('previous')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${analyticsRange === 'previous'
                        ? 'bg-white dark:bg-slate-900 text-primary-650 dark:text-primary-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-950 dark:hover:text-slate-100'
                      }`}
                  >
                    Tháng trước
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 h-10 px-4 rounded-[10px] bg-primary-600 hover:bg-primary-750 text-white text-xs font-bold transition-all border border-primary-500/20 shadow-sm shadow-primary-500/10 cursor-pointer"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  Xuất báo cáo
                </button>
              </div>
            </div>

            {/* Scrollable details pane */}
            <div className="flex-1 overflow-y-auto mt-6 pr-1 space-y-6">
              {loadingAnalytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                  </div>
                  <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
              ) : analytics ? (
                <>
                  {/* Performance Indicators Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Attendance Rate Circle */}
                    <div className="p-4 bg-white dark:bg-slate-850/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-5 shadow-sm text-left">
                      <div className="relative shrink-0">
                        <svg className="w-16 h-16" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100 dark:text-slate-800"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-emerald-500 transition-all duration-500"
                            strokeWidth="3.5"
                            strokeDasharray={`${analytics.summary.attendanceRate}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <text x="18" y="20.5" className="font-extrabold text-[8px]" textAnchor="middle" fill="currentColor">
                            {analytics.summary.attendanceRate}%
                          </text>
                        </svg>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chỉ số chuyên cần</span>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 block">Tỷ lệ hoàn thành công</h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-400 block font-medium">Hoàn thành {analytics.summary.totalCompleted} trên tổng số {analytics.summary.totalAssigned} ca làm</p>
                      </div>
                    </div>

                    {/* Worked Hours Stopwatch */}
                    <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl flex items-center gap-5 shadow-sm text-left">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-650 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
                        <RiTimerLine />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số giờ công thực tế</span>
                        <h4 className="text-xl font-black text-slate-900 dark:text-slate-50 font-mono block">
                          {analytics.summary.totalWorkingHours} giờ
                        </h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-400 block font-medium">Thời gian tích lũy tại điểm làm việc</p>
                      </div>
                    </div>

                    {/* SVG Doughnut Chart */}
                    <div className="p-4 bg-white dark:bg-slate-850/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-4 shadow-sm text-left">
                      <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          {!hasData ? (
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="4.2" />
                          ) : (
                            (() => {
                              let offsetAccumulator = 0;
                              return doughnutSegments.map((seg, idx) => {
                                const strokeDash = `${seg.pct} 100`;
                                const strokeOffset = 100 - offsetAccumulator;
                                offsetAccumulator += seg.pct;
                                return (
                                  <circle
                                    key={idx}
                                    cx="18"
                                    cy="18"
                                    r="15.9155"
                                    fill="none"
                                    stroke={seg.strokeColor}
                                    strokeWidth="4.2"
                                    strokeDasharray={strokeDash}
                                    strokeDashoffset={strokeOffset}
                                    className="transition-all duration-550"
                                  />
                                );
                              });
                            })()
                          )}
                        </svg>
                        <div className="absolute flex flex-col justify-center items-center text-[8px] font-black text-slate-500">
                          <span>{total} ca</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phân phối chuyên cần</span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                          {doughnutSegments.map((seg, idx) => (
                            <div key={idx} className="flex items-center gap-1 min-w-0 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full ${seg.colorClass} inline-block shrink-0`} />
                              <span className="truncate">{seg.label} ({seg.displayPct}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second Row: Detailed Stats Accordion Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* On-Time Card */}
                    <div className="p-4 bg-white dark:bg-slate-850/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-sm text-left relative">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đi đúng giờ</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center text-sm font-bold">
                          <FiCheck className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                          {onTime} ca
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 font-semibold">
                          <span>Đạt tỷ lệ:</span>
                          <span className="text-emerald-600 font-bold">{pctOnTime}%</span>
                          <span className="cursor-help text-slate-400 hover:text-slate-650 ml-0.5" title="Check-in đúng hoặc sớm hơn giờ bắt đầu ca.">
                            <FiInfo className="w-3.5 h-3.5 inline" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Late Card */}
                    <div className="p-4 bg-white dark:bg-slate-850/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-sm text-left relative">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đi muộn</span>
                        <button
                          onClick={() => setExpandedLate(!expandedLate)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black cursor-pointer transition-colors ${expandedLate
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 hover:bg-amber-100/50'
                            }`}
                        >
                          {late}
                        </button>
                      </div>
                      <div className="mt-3">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                          {late} lần
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500 font-semibold">Tổng thời gian: <strong className="text-amber-600 font-bold font-mono">{totalLateMinutes} phút</strong></span>
                          <button
                            onClick={() => setExpandedLate(!expandedLate)}
                            className="text-[10px] font-bold text-primary-600 hover:underline cursor-pointer"
                          >
                            {expandedLate ? 'Ẩn' : 'Chi tiết'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable list */}
                      {expandedLate && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-30 max-h-48 overflow-y-auto space-y-1.5 animate-fadeIn">
                          <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Chi tiết đi muộn</span>
                            <button onClick={() => setExpandedLate(false)} className="text-[9px] text-slate-400 hover:text-slate-600 font-bold">Đóng</button>
                          </div>
                          {analytics.dailyData.filter(d => d.status === 'LATE').length === 0 ? (
                            <p className="text-[10px] text-slate-450 italic py-1">Không có lần đi muộn nào.</p>
                          ) : (
                            analytics.dailyData.filter(d => d.status === 'LATE').map((day, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{dayjs(day.date).format('DD/MM/YYYY')}</span>
                                <span className="text-amber-600 font-bold font-mono">Trễ {getLateMinutes(day)} phút</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Early Leave Card */}
                    <div className="p-4 bg-white dark:bg-slate-850/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-sm text-left relative">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Về sớm</span>
                        <button
                          onClick={() => setExpandedEarly(!expandedEarly)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black cursor-pointer transition-colors ${expandedEarly
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 hover:bg-blue-100/50'
                            }`}
                        >
                          {early}
                        </button>
                      </div>
                      <div className="mt-3">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                          {early} lần
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500 font-semibold">Tổng thời gian: <strong className="text-blue-600 font-bold font-mono">{totalEarlyLeaveMinutes} phút</strong></span>
                          <button
                            onClick={() => setExpandedEarly(!expandedEarly)}
                            className="text-[10px] font-bold text-primary-600 hover:underline cursor-pointer"
                          >
                            {expandedEarly ? 'Ẩn' : 'Chi tiết'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable list */}
                      {expandedEarly && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-30 max-h-48 overflow-y-auto space-y-1.5 animate-fadeIn">
                          <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Chi tiết về sớm</span>
                            <button onClick={() => setExpandedEarly(false)} className="text-[9px] text-slate-400 hover:text-slate-600 font-bold">Đóng</button>
                          </div>
                          {analytics.dailyData.filter(d => d.status === 'EARLY_LEAVE').length === 0 ? (
                            <p className="text-[10px] text-slate-455 italic py-1">Không có lần về sớm nào.</p>
                          ) : (
                            analytics.dailyData.filter(d => d.status === 'EARLY_LEAVE').map((day, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{dayjs(day.date).format('DD/MM/YYYY')}</span>
                                <span className="text-blue-600 font-bold font-mono">Về sớm {getEarlyLeaveMinutes(day)} phút</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Absent Card */}
                    <div className="p-4 bg-white dark:bg-slate-850/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-sm text-left relative">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vắng mặt</span>
                        <button
                          onClick={() => setExpandedAbsent(!expandedAbsent)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black cursor-pointer transition-colors ${expandedAbsent
                              ? 'bg-red-650 text-white'
                              : 'bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100/50'
                            }`}
                        >
                          {abs}
                        </button>
                      </div>
                      <div className="mt-3">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                          {abs} ca
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold">Tự động đánh dấu vắng</span>
                          <button
                            onClick={() => setExpandedAbsent(!expandedAbsent)}
                            className="text-[10px] font-bold text-primary-600 hover:underline cursor-pointer"
                          >
                            {expandedAbsent ? 'Ẩn' : 'Chi tiết'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable list */}
                      {expandedAbsent && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-30 max-h-48 overflow-y-auto space-y-1.5 animate-fadeIn">
                          <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Chi tiết vắng mặt</span>
                            <button onClick={() => setExpandedAbsent(false)} className="text-[9px] text-slate-400 hover:text-slate-600 font-bold">Đóng</button>
                          </div>
                          {analytics.dailyData.filter(d => d.status === 'ABSENT').length === 0 ? (
                            <p className="text-[10px] text-slate-455 italic py-1">Không có ngày vắng nào.</p>
                          ) : (
                            analytics.dailyData.filter(d => d.status === 'ABSENT').map((day, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{dayjs(day.date).format('DD/MM/YYYY')}</span>
                                <span className="text-red-500 font-bold">Không Check-in</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: General Summary */}
                  <div className="w-full">
                    {/* Summary statistics result card */}
                    <Card className="space-y-4 text-left p-5 bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl h-fit shadow-sm">
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 flex-shrink-0">
                        <FiActivity className="w-4 h-4 text-primary-500" />
                        <h3 className="text-xs font-bold text-slate-750 dark:text-slate-200 uppercase tracking-wider">
                          Kết quả chuyên cần tháng
                        </h3>
                      </div>
                      <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-500 font-semibold">Tổng số ca:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">{total} ca</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-500 font-semibold">Đi đúng giờ:</span>
                          <span className="font-bold text-emerald-600 font-mono">{onTime} ca</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-500 font-semibold">Đi muộn:</span>
                          <span className="font-bold text-amber-500 font-mono">{late} lần</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-500 font-semibold">Về sớm:</span>
                          <span className="font-bold text-blue-500 font-mono">{early} lần</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-500 font-semibold">Vắng mặt:</span>
                          <span className="font-bold text-red-500 font-mono">{abs} ca</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-500 font-semibold">Tổng phút đi muộn:</span>
                          <span className="font-bold text-amber-600 font-mono">{totalLateMinutes} phút</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-500 font-semibold">Tổng phút về sớm:</span>
                          <span className="font-bold text-blue-600 font-mono">{totalEarlyLeaveMinutes} phút</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-500 font-semibold">Tổng giờ công:</span>
                          <span className="font-bold text-emerald-655 dark:text-emerald-450 font-mono">{analytics.summary.totalWorkingHours} giờ</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Không tải được dữ liệu thống kê
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <FiInfo className="text-3xl text-slate-300" />
            <p className="text-xs">Vui lòng chọn một nhân viên để xem thống kê công.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendanceAnalytics;
