import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiBriefcase, FiMapPin, FiCalendar, FiActivity, 
  FiAlertTriangle, FiCloudLightning, FiShield, FiCheckSquare,
  FiRefreshCw, FiArrowRight, FiInfo, FiChevronLeft, FiChevronRight,
  FiFileText, FiClock
} from 'react-icons/fi';
import dayjs from 'dayjs';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { workLocationService } from '../services/workLocationService';
import { assignmentService } from '../services/assignmentService';
import { dashboardService } from '../services/dashboardService';
import { accountService } from '../services/accountService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { otService } from '../services/otService';
import reviewQueueService from '../services/reviewQueueService';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, subtitle, loadingState, onClick }) => (
  <Card 
    onClick={onClick}
    className="hover-scale flex flex-col justify-between border border-slate-100 dark:border-slate-800/80 shadow-sm rounded-2xl bg-white dark:bg-slate-900 p-5 cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all group relative overflow-hidden text-left"
  >
    <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1 text-left">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </span>
        {loadingState ? (
          <Skeleton className="h-8 w-16 my-1" />
        ) : (
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {value}
          </span>
        )}
      </div>
      <div className="p-3 rounded-2xl bg-primary-50 dark:bg-slate-850 text-primary-650 dark:text-primary-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
    <div className="mt-4 text-left flex items-center justify-between">
      <span className="text-xs text-slate-400">{subtitle}</span>
      <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
        Chi tiết <FiArrowRight className="w-3 h-3" />
      </span>
    </div>
  </Card>
);

const CalendarWidget = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  const resetToToday = () => {
    setCurrentMonth(dayjs());
    setSelectedDate(dayjs());
  };

  const startOfMonth = currentMonth.startOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfWeek = (startOfMonth.day() + 6) % 7; // 0=Mon, 6=Sun

  const prevMonthObj = currentMonth.subtract(1, 'month');
  const daysInPrevMonth = prevMonthObj.daysInMonth();

  const days = [];

  // Padding from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthObj.date(daysInPrevMonth - i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = currentMonth.date(i);
    days.push({ date: d, isCurrentMonth: true });
  }

  // Padding for next month to complete 35 or 42 cells grid
  const totalSlots = days.length > 35 ? 42 : 35;
  const remainingCells = totalSlots - days.length;
  const nextMonthObj = currentMonth.add(1, 'month');
  for (let i = 1; i <= remainingCells; i++) {
    const d = nextMonthObj.date(i);
    days.push({ date: d, isCurrentMonth: false });
  }

  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayStr = dayjs().format('YYYY-MM-DD');
  const selectedStr = selectedDate.format('YYYY-MM-DD');

  const getDayOfWeekName = (date) => {
    const day = date.day();
    if (day === 0) return 'Chủ Nhật';
    return `Thứ ${day + 1}`;
  };

  return (
    <Card className="flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm min-h-[380px]">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Lịch hệ thống
        </h3>
        <button 
          onClick={resetToToday}
          className="text-[10px] bg-primary-50 dark:bg-primary-950/30 text-primary-650 dark:text-primary-400 hover:bg-primary-100 font-bold px-2 py-1 rounded-lg border border-primary-100 dark:border-primary-900/30 transition-colors uppercase"
        >
          Hôm nay
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button 
          onClick={prevMonth}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Tháng trước"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
          Tháng {currentMonth.format('MM / YYYY')}
        </span>
        <button 
          onClick={nextMonth}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Tháng sau"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekdays.map((wd, i) => (
              <span key={wd} className={`text-[10px] font-bold ${i >= 5 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {wd}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((item, idx) => {
              const dateStr = item.date.format('YYYY-MM-DD');
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedStr;
              const isWeekend = item.date.day() === 0 || item.date.day() === 6;

              let btnClasses = "w-7 h-7 mx-auto flex items-center justify-center rounded-xl text-xs transition-all duration-150 cursor-pointer ";

              if (isSelected) {
                btnClasses += "bg-primary-600 text-white font-bold shadow-md scale-105 ";
              } else if (isToday) {
                btnClasses += "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700 ";
              } else if (!item.isCurrentMonth) {
                btnClasses += "text-slate-300 dark:text-slate-700 hover:text-slate-500 ";
              } else if (isWeekend) {
                btnClasses += "text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-medium ";
              } else {
                btnClasses += "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium ";
              }

              return (
                <div key={idx} className="p-0.5 flex items-center justify-center">
                  <button
                    onClick={() => setSelectedDate(item.date)}
                    className={btnClasses}
                  >
                    {item.date.date()}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer detail */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {getDayOfWeekName(selectedDate)}, {selectedDate.format('DD/MM/YYYY')}
          </span>
          {selectedStr === todayStr && (
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full">
              Hôm nay
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    employees: null,
    departments: null,
    locations: null,
    assignmentsToday: null,
  });

  const [dbStats, setDbStats] = useState({
    totalAccounts: null,
    todayAttendanceCount: null,
    pendingLeaveCount: null,
    pendingOtCount: null,
    pendingReviewCount: null,
  });

  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const today = dayjs().format('YYYY-MM-DD');

  // Modal state for detailed view on StatCard click
  const [activeModal, setActiveModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState([]);

  const handleOpenStatModal = async (key) => {
    const configMap = {
      employees: { key: 'employees', title: 'Chi tiết Tổng số Nhân viên', path: '/admin/employees' },
      departments: { key: 'departments', title: 'Chi tiết Phòng ban', path: '/admin/departments' },
      locations: { key: 'locations', title: 'Chi tiết Địa điểm làm việc', path: '/admin/work-locations' },
      assignmentsToday: { key: 'assignmentsToday', title: 'Chi tiết Phân công Hôm nay', path: '/admin/assignments' },
      totalAccounts: { key: 'totalAccounts', title: 'Chi tiết Tài khoản Hệ thống', path: '/admin/employees' },
      todayAttendanceCount: { key: 'todayAttendanceCount', title: 'Lượt Chấm công Hôm nay', path: '/admin/attendance' },
      pendingLeaveCount: { key: 'pendingLeaveCount', title: 'Chi tiết Đơn nghỉ phép chờ duyệt', path: '/admin/leave' },
      pendingOtCount: { key: 'pendingOtCount', title: 'Chi tiết Đơn tăng ca chờ duyệt', path: '/admin/ot' },
      pendingReviewCount: { key: 'pendingReviewCount', title: 'Chi tiết Chấm công chờ kiểm duyệt', path: '/admin/review-queue' },
    };

    const modalConfig = configMap[key];
    if (!modalConfig) return;

    setActiveModal(modalConfig);
    setModalLoading(true);
    setModalData([]);

    try {
      if (key === 'employees') {
        const res = await employeeService.getEmployees({ limit: 10 });
        setModalData(res?.data?.items || []);
      } else if (key === 'departments') {
        const res = await departmentService.getDepartments({ limit: 10 });
        setModalData(res?.data?.items || []);
      } else if (key === 'locations') {
        const res = await workLocationService.getWorkLocations({ limit: 10 });
        setModalData(res?.data?.items || []);
      } else if (key === 'assignmentsToday') {
        const res = await assignmentService.getAssignments({ limit: 10, workDate: today });
        setModalData(res?.data?.items || []);
      } else if (key === 'totalAccounts') {
        const res = await accountService.getAccounts({ limit: 10 });
        setModalData(res?.data?.items || []);
      } else if (key === 'todayAttendanceCount') {
        const res = await attendanceService.getAdminAttendance({ limit: 10, fromDate: today, toDate: today, workDate: today });
        setModalData(res?.data?.items || []);
      } else if (key === 'pendingLeaveCount') {
        const res = await leaveService.getAdminRequests({ limit: 10, status: 'PENDING' });
        setModalData(res?.data?.items || []);
      } else if (key === 'pendingOtCount') {
        const res = await otService.getAdminRequests({ limit: 10, status: 'PENDING' });
        setModalData(res?.data?.items || (Array.isArray(res?.data) ? res.data : []));
      } else if (key === 'pendingReviewCount') {
        const res = await reviewQueueService.getReviewQueue({ limit: 10 });
        setModalData(res?.data?.items || []);
      }
    } catch (err) {
      console.error('Error loading stat modal data:', err);
    } finally {
      setModalLoading(false);
    }
  };


  // Charts state
  const [chartsData, setChartsData] = useState(null);
  const [loadingCharts, setLoadingCharts] = useState(true);

  const fetchRealMetrics = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, locRes, assignRes] = await Promise.all([
        employeeService.getEmployees({ limit: 1 }),
        departmentService.getDepartments({ limit: 1 }),
        workLocationService.getWorkLocations({ limit: 1 }),
        assignmentService.getAssignments({ limit: 1, workDate: today }),
      ]);

      setMetrics({
        employees: empRes?.data?.pagination?.totalItems ?? empRes?.data?.pagination?.total ?? 0,
        departments: deptRes?.data?.pagination?.totalItems ?? deptRes?.data?.pagination?.total ?? 0,
        locations: locRes?.data?.pagination?.totalItems ?? locRes?.data?.pagination?.total ?? 0,
        assignmentsToday: assignRes?.data?.pagination?.totalItems ?? assignRes?.data?.pagination?.total ?? 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard real metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, accountsRes, leaveRes, otRes, reviewRes] = await Promise.all([
        dashboardService.getStats(),
        accountService.getAccounts({ limit: 1 }),
        leaveService.getAdminRequests({ limit: 1, status: 'PENDING' }),
        otService.getAdminRequests({ limit: 1, status: 'PENDING' }),
        reviewQueueService.getReviewQueue({ limit: 1 }).catch(() => null),
      ]);

      if (statsRes?.success && statsRes?.data) {
        const pendingLeaveCount = leaveRes?.data?.pagination?.totalItems ?? leaveRes?.data?.pagination?.total ?? leaveRes?.data?.total ?? leaveRes?.pagination?.totalItems ?? 0;
        const pendingOtCount = otRes?.pagination?.totalItems ?? otRes?.pagination?.total ?? otRes?.data?.pagination?.totalItems ?? otRes?.data?.pagination?.total ?? otRes?.data?.total ?? (Array.isArray(otRes?.data) ? otRes?.data?.length : 0);
        const pendingReviewCount = reviewRes?.data?.pagination?.totalItems ?? reviewRes?.data?.pagination?.total ?? statsRes.data.pendingReviewCount ?? 0;

        setDbStats({
          totalAccounts: accountsRes?.data?.pagination?.totalItems ?? accountsRes?.data?.pagination?.total ?? statsRes.data.totalAccounts ?? 0,
          todayAttendanceCount: statsRes.data.todayAttendanceCount ?? 0,
          pendingLeaveCount,
          pendingOtCount,
          pendingReviewCount,
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats API:', err);
    } finally {
      setLoadingStats(false);
    }
  };


  const fetchChartsData = async () => {
    setLoadingCharts(true);
    try {
      const res = await dashboardService.getCharts();
      if (res && res.success && res.data) {
        setChartsData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard charts:', err);
    } finally {
      setLoadingCharts(false);
    }
  };

  useEffect(() => {
    fetchRealMetrics();
    fetchDashboardStats();
    fetchChartsData();
  }, [today]);

  const handleRefreshAll = () => {
    fetchRealMetrics();
    fetchDashboardStats();
    fetchChartsData();
  };

  // Render helper replaced with top-level StatCard component

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bảng điều khiển</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Thống kê hoạt động của hệ thống chấm công ngày {dayjs().format('DD/MM/YYYY')}</p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors shadow-sm bg-white dark:bg-slate-900"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Stats Grid - Core items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng nhân viên" 
          value={metrics.employees} 
          icon={<FiUsers className="w-5 h-5" />} 
          subtitle="Đồng bộ thời gian thực"
          loadingState={loading}
          onClick={() => handleOpenStatModal('employees')}
        />
        <StatCard 
          title="Tổng phòng ban" 
          value={metrics.departments} 
          icon={<FiBriefcase className="w-5 h-5" />} 
          subtitle="Đồng bộ thời gian thực" 
          loadingState={loading}
          onClick={() => handleOpenStatModal('departments')}
        />
        <StatCard 
          title="Tổng địa điểm" 
          value={metrics.locations} 
          icon={<FiMapPin className="w-5 h-5" />} 
          subtitle="Tọa độ và geofence" 
          loadingState={loading}
          onClick={() => handleOpenStatModal('locations')}
        />
        <StatCard 
          title="Phân công hôm nay" 
          value={metrics.assignmentsToday} 
          icon={<FiCalendar className="w-5 h-5" />} 
          subtitle={`Ngày làm việc: ${today}`} 
          loadingState={loading}
          onClick={() => handleOpenStatModal('assignmentsToday')}
        />
      </div>

      {/* Real Metrics & Pending Approvals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="Tổng số tài khoản" 
          value={dbStats.totalAccounts} 
          icon={<FiShield className="w-5 h-5" />} 
          subtitle="Hệ thống tài khoản phân quyền" 
          loadingState={loadingStats}
          onClick={() => handleOpenStatModal('totalAccounts')}
        />
        <StatCard 
          title="Đã chấm công hôm nay" 
          value={dbStats.todayAttendanceCount} 
          icon={<FiActivity className="w-5 h-5" />} 
          subtitle="Check-in/Check-out hôm nay" 
          loadingState={loadingStats}
          onClick={() => handleOpenStatModal('todayAttendanceCount')}
        />
        <StatCard 
          title="Chờ duyệt nghỉ phép" 
          value={dbStats.pendingLeaveCount} 
          icon={<FiFileText className="w-5 h-5 text-blue-500" />} 
          subtitle="Đơn nghỉ phép chờ phê duyệt" 
          loadingState={loadingStats}
          onClick={() => handleOpenStatModal('pendingLeaveCount')}
        />
        <StatCard 
          title="Chờ duyệt tăng ca" 
          value={dbStats.pendingOtCount} 
          icon={<FiClock className="w-5 h-5 text-indigo-500" />} 
          subtitle="Đơn tăng ca chờ phê duyệt" 
          loadingState={loadingStats}
          onClick={() => handleOpenStatModal('pendingOtCount')}
        />
        <StatCard 
          title="Chờ duyệt chấm công" 
          value={dbStats.pendingReviewCount} 
          icon={<FiCheckSquare className="w-5 h-5 text-amber-500" />} 
          subtitle="Yêu cầu kiểm duyệt chấm công" 
          loadingState={loadingStats}
          onClick={() => handleOpenStatModal('pendingReviewCount')}
        />
      </div>



      {/* 5. Cumulative Statistics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Widget: Last 7 Days Attendance Trend */}
        <Card className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm min-h-[380px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 flex-shrink-0">
            <div className="flex flex-col gap-0.5 text-left">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FiActivity className="w-4 h-4 text-emerald-500" />
                Xu hướng điểm danh (7 ngày gần đây)
              </h3>
              <span className="text-[11px] text-slate-400">Thống kê lượt chấm công và tỷ lệ đi muộn / về sớm</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-medium self-start sm:self-auto bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm block"></span>
                <span className="text-slate-600 dark:text-slate-300">Đúng giờ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm block"></span>
                <span className="text-slate-600 dark:text-slate-300">Muộn / Sớm</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end pt-2">
            {loadingCharts ? (
              <div className="h-52 w-full flex items-end justify-between gap-3 px-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-[60%] rounded-2xl" />
                ))}
              </div>
            ) : !chartsData || !chartsData.attendanceByDay || chartsData.attendanceByDay.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                <FiInfo className="w-5 h-5 text-slate-300" />
                <span>Không có dữ liệu điểm danh trong 7 ngày qua</span>
              </div>
            ) : (
              <div className="h-52 w-full flex items-end justify-between gap-2 sm:gap-4 px-1">
                {(() => {
                  const maxCount = Math.max(...chartsData.attendanceByDay.map(d => d.count || 0), 5);
                  
                  return chartsData.attendanceByDay.map((day, idx) => {
                    const total = day.count || 0;
                    const late = (day.late || 0) + (day.earlyLeave || 0);
                    const onTime = Math.max(0, total - late);
                    const dObj = dayjs(day.date);
                    const dayName = dObj.day() === 0 ? 'CN' : `T${dObj.day() + 1}`;
                    const isToday = dObj.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-3 bg-slate-900/95 dark:bg-slate-950 text-white text-[11px] font-medium py-2 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-2xl z-30 whitespace-nowrap text-center backdrop-blur-md border border-slate-700/50">
                          <p className="font-bold text-slate-100 border-b border-slate-700/50 pb-1 mb-1">
                            {dObj.format('DD/MM/YYYY')}
                          </p>
                          <div className="space-y-0.5 text-[10px] text-left">
                            <p className="flex items-center justify-between gap-4 text-slate-300">
                              <span>Tổng lượt:</span>
                              <strong className="text-white font-mono">{total}</strong>
                            </p>
                            <p className="flex items-center justify-between gap-4 text-emerald-400">
                              <span>Đúng giờ:</span>
                              <strong className="font-mono">{onTime}</strong>
                            </p>
                            {late > 0 && (
                              <p className="flex items-center justify-between gap-4 text-amber-400">
                                <span>Muộn / Sớm:</span>
                                <strong className="font-mono">{late}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Top count badge */}
                        <span className={`text-[10px] font-bold mb-1.5 transition-colors ${total > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-transparent'}`}>
                          {total > 0 ? total : '0'}
                        </span>

                        {/* Pillar track container */}
                        <div className={`w-full max-w-[32px] sm:max-w-[40px] flex-1 rounded-2xl p-1 flex flex-col justify-end relative transition-all duration-200 ${
                          isToday 
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20' 
                            : 'bg-slate-50 dark:bg-slate-850/60 group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                        }`}>
                          {total === 0 ? (
                            <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/50 rounded-full" />
                          ) : (
                            <div 
                              className="w-full flex flex-col justify-end gap-0.5 rounded-xl overflow-hidden transition-all duration-500"
                              style={{ height: `${Math.max((total / maxCount) * 100, 8)}%` }}
                            >
                              {/* Late / Early segment */}
                              {late > 0 && (
                                <div 
                                  className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all duration-300 shadow-sm"
                                  style={{ height: `${(late / total) * 100}%` }}
                                />
                              )}

                              {/* On-Time segment */}
                              {onTime > 0 && (
                                <div 
                                  className={`w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300 shadow-sm ${
                                    late > 0 ? 'rounded-b-lg' : 'rounded-lg'
                                  }`}
                                  style={{ height: `${(onTime / total) * 100}%` }}
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* X-axis Label */}
                        <div className="mt-2.5 flex flex-col items-center">
                          <span className={`text-[11px] font-bold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {dObj.format('DD/MM')}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                            {dayName}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </Card>

        {/* Widget: System Calendar */}
        <CalendarWidget />
      </div>

      {/* Detail Popup Modal on StatCard click */}
      <Modal
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={activeModal?.title || 'Chi tiết dữ liệu'}
        size="lg"
      >
        {modalLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : modalData.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <FiInfo className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            <span>Chưa có dữ liệu chi tiết nào được ghi nhận</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto pr-1">
            {activeModal?.key === 'employees' && modalData.map((emp, i) => {
              const empName = emp.fullName || emp.full_name || emp.name || 'Nhân viên';
              const empCode = emp.employeeCode || emp.employee_code || emp.code || '';
              const deptName = emp.departmentName || emp.department_name || emp.department?.departmentName || emp.department?.department_name || 'Bộ phận Kỹ Thuật';
              const posName = emp.positionName || emp.position_name || emp.position || 'Nhân viên';
              return (
                <div key={emp.employeeId || emp.employee_id || i} className="py-3 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-slate-800 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                      {empName.substring(0, 2)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {empName} {empCode ? `(${empCode})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {deptName} • {posName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-semibold text-slate-600 dark:text-slate-300">
                    {emp.status === 'ACTIVE' || emp.status === 1 ? 'Hoạt động' : emp.status || 'Chính thức'}
                  </span>
                </div>
              );
            })}

            {activeModal?.key === 'departments' && modalData.map((dept, i) => {
              const deptName = dept.departmentName || dept.department_name || dept.name || 'Phòng ban';
              const deptCode = dept.departmentCode || dept.department_code || dept.code || '';
              const posName = dept.positionName || dept.position_name || dept.position || (parseInt(dept.status, 10) === 1 || dept.status === 'ACTIVE' ? 'Hoạt động' : 'Phòng ban');
              return (
                <div key={dept.departmentId || dept.department_id || i} className="py-3 flex items-center justify-between gap-3 text-left">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {deptName} {deptCode ? `(${deptCode})` : ''}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {dept.description || 'Bộ phận phòng ban'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {posName}
                  </span>
                </div>
              );
            })}

            {activeModal?.key === 'locations' && modalData.map((loc, i) => {
              const locName = loc.locationName || loc.location_name || loc.name || 'Địa điểm';
              const addr = loc.address || 'Tọa độ GPS Geofence';
              const radius = loc.radius || 100;
              return (
                <div key={loc.locationId || loc.location_id || i} className="py-3 flex items-center justify-between gap-3 text-left">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {locName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {addr}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 rounded">
                    Bán kính {radius}m
                  </span>
                </div>
              );
            })}

            {activeModal?.key === 'assignmentsToday' && modalData.map((item, i) => {
              const empName = item.employee?.fullName || item.employee?.full_name || item.employeeName || 'Nhân viên';
              const locName = item.location?.locationName || item.location?.location_name || item.locationName || 'Địa điểm';
              const workDate = item.workDate || item.work_date || today;
              return (
                <div key={item.assignmentId || item.assignment_id || i} className="py-3 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-slate-800 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                      {empName.substring(0, 2)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {empName}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {locName} • {dayjs(workDate).format('DD/MM/YYYY')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-slate-600 dark:text-slate-300">
                    {item.shiftName || item.shift_name || 'Ca hành chính'}
                  </span>
                </div>
              );
            })}

            {activeModal?.key === 'pendingReviewCount' && modalData.map((item, i) => {
              const empName = item.employee?.fullName || item.employee?.full_name || item.employeeName || 'Nhân viên';
              const empCode = item.employee?.employeeCode || item.employee?.employee_code || item.employeeCode || '';
              const deptName = item.department?.departmentName || item.departmentName || 'Chấm công';
              const workDate = item.workDate || item.work_date || today;
              const risk = item.riskLevel || 'MEDIUM';

              return (
                <div key={item.attendanceId || item.attendance_id || i} className="py-3 flex items-center justify-between gap-3 text-left border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                      {empName.substring(0, 2)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {empName} {empCode ? `(${empCode})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {deptName} • Ngày {dayjs(workDate).format('DD/MM/YYYY')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full shrink-0">
                    Mức rủi ro: {risk}
                  </span>
                </div>
              );
            })}

            {activeModal?.key === 'totalAccounts' && modalData.map((acc, i) => {
              const accountName = 
                acc.fullName || 
                acc.full_name || 
                acc.employeeName || 
                acc.employee_name || 
                acc.employee?.fullName || 
                acc.employee?.full_name || 
                acc.displayName || 
                acc.display_name || 
                acc.name || 
                acc.username || 
                'Tài khoản';
              const role = acc.role || acc.role_name || acc.roleName || 'USER';

              return (
                <div key={acc.accountId || acc.account_id || i} className="py-3 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                      {accountName.substring(0, 2)}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {accountName}
                    </span>
                  </div>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold px-2 py-1 rounded uppercase">
                    {role}
                  </span>
                </div>
              );
            })}

            {(activeModal?.key === 'todayAttendanceCount' || activeModal?.key === 'todayOfflineSyncCount') && modalData.map((item, i) => {
              const isAttendanceRecord = item.attendanceId || item.attendance_id || item.employee;

              if (isAttendanceRecord) {
                const empName = item.employee?.fullName || item.employee?.full_name || item.employeeName || 'Nhân viên';
                const empCode = item.employee?.employeeCode || item.employee?.employee_code || item.employeeCode || '';
                const deptName = item.employee?.departmentName || item.department?.departmentName || item.departmentName || 'Chấm công';
                const ciRaw = item.checkInTime || item.check_in_time;
                const coRaw = item.checkOutTime || item.check_out_time;
                const checkIn = ciRaw ? dayjs(ciRaw).format('HH:mm:ss') : 'Chưa CI';
                const checkOut = coRaw ? dayjs(coRaw).format('HH:mm:ss') : 'Chưa CO';
                const status = item.attendanceStatus || item.attendance_status || 'Thành công';

                return (
                  <div key={item.attendanceId || item.attendance_id || i} className="py-3 flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                        {empName.substring(0, 2)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {empName} {empCode ? `(${empCode})` : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {deptName} • Check-in: <strong className="text-emerald-600 dark:text-emerald-400">{checkIn}</strong> • Check-out: <strong className="text-blue-600 dark:text-blue-400">{checkOut}</strong>
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 rounded">
                      {status}
                    </span>
                  </div>
                );
              }

              const desc = item.description || item.action_description || 'Hoạt động hệ thống';
              const name = item.fullName || item.full_name || (item.employeeCode || item.employee_code ? `Nhân viên (${item.employeeCode || item.employee_code})` : 'Hệ thống');
              const act = item.action || item.action_type || 'SYSTEM';
              const actionTime = item.actionTime || item.action_time || item.created_at || new Date();
              return (
                <div key={item.logId || item.log_id || i} className="py-3 flex items-center justify-between gap-3 text-left">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {desc}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {name} • {act}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {dayjs(actionTime).format('HH:mm DD/MM')}
                  </span>
                </div>
              );
            })}

            {(activeModal?.key === 'pendingLeaveCount' || activeModal?.key === 'pendingOtCount') && modalData.map((item, i) => {
              const empName = item.employeeFullName || item.full_name || item.employee_full_name || item.employee?.fullName || 'Nhân viên';
              const empCode = item.employeeCode || item.employee_code || item.employee?.employeeCode || '';
              const reason = item.reason || 'Không có lý do';
              const startDate = item.startDate || item.start_date || item.workDate;
              const endDate = item.endDate || item.end_date || item.workDate;
              const leaveTypeMap = {
                ANNUAL: 'Nghỉ phép năm',
                SICK: 'Nghỉ bệnh',
                MARRIAGE: 'Nghỉ cưới',
                MATERNITY: 'Nghỉ thai sản',
                OTHER: 'Nghỉ khác',
                COMPENSATORY: 'Nghỉ bù'
              };
              const typeText = leaveTypeMap[item.leaveType || item.leave_type] || item.leaveType || 'Đơn xin nghỉ';

              return (
                <div key={item.leaveRequestId || item.otRequestId || item.leave_request_id || i} className="py-3 flex items-center justify-between gap-3 text-left border-b border-slate-100 dark:border-slate-800/60 last:border-none">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                      {empName.substring(0, 2)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {empName} {empCode ? `(${empCode})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {typeText} • Lý do: {reason}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Từ {dayjs(startDate).format('DD/MM/YYYY')} {endDate ? `đến ${dayjs(endDate).format('DD/MM/YYYY')}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full shrink-0">
                    CHỜ DUYỆT
                  </span>
                </div>
              );
            })}

            {!modalLoading && modalData.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                Không có dữ liệu hiển thị
              </div>
            )}
          </div>
        )}

        {/* Modal Footer with Direct Link */}
        {activeModal?.path && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => {
                const path = activeModal.path;
                setActiveModal(null);
                navigate(path);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>Xem trang quản lý đầy đủ</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
