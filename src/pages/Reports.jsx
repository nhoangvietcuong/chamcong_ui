import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFileText, FiTrendingUp, FiPieChart, FiBarChart2,
  FiAlertTriangle, FiCheckCircle, FiClock, FiRefreshCw,
  FiCalendar, FiUsers, FiMapPin, FiShield, FiWifi, FiXCircle,
  FiDownload, FiPrinter, FiActivity
} from 'react-icons/fi';
import Card from '../components/Card';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import reportService from '../services/reportService';
import attendanceService from '../services/attendanceService';
import useApp from '../hooks/useApp';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Helper to format time durations:
// - Under 1 hour: 4 minutes -> "4m"
// - 1 hour or more: 2h 15m -> "2.15h", 1h 30m -> "1.30h", 8 hours -> "8h"
const formatHoursToHMM = (valInHours) => {
  if (valInHours === undefined || valInHours === null || valInHours === 0) return '0h';
  const totalMins = Math.round(valInHours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}.${String(m).padStart(2, '0')}h`;
};

// ─── Stat Card Component ─────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'primary', loading }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    green:   'bg-green-50   text-green-600   dark:bg-green-900/30   dark:text-green-400',
    amber:   'bg-amber-50   text-amber-600   dark:bg-amber-900/30   dark:text-amber-400',
    red:     'bg-red-50     text-red-600     dark:bg-red-900/30     dark:text-red-400',
    violet:  'bg-violet-50  text-violet-600  dark:bg-violet-900/30  dark:text-violet-400',
    slate:   'bg-slate-100  text-slate-600   dark:bg-slate-700      dark:text-slate-300',
  };
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
        {loading ? (
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-0.5" />
        ) : (
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{value ?? '—'}</p>
        )}
        {sub && !loading && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function RateBar({ label, rate, color = '#6366f1', loading }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        {loading
          ? <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          : <span className="font-semibold text-slate-800 dark:text-slate-100">{rate != null ? `${rate}%` : '—'}</span>
        }
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: loading ? '0%' : `${Math.min(rate ?? 0, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Daily Trend Mini Bar Chart ───────────────────────────────────────────────
function TrendChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex items-end gap-1.5 h-24">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t animate-pulse" style={{ height: `${30 + Math.random() * 50}%` }} />
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-slate-400">Chưa có dữ liệu</div>
    );
  }
  const maxVal = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => {
        const pct = Math.max((d.total / maxVal) * 100, 4);
        const cPct = d.total > 0 ? (d.completed / d.total) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group" title={`${d.date}: ${d.total} bản ghi, ${d.completed} hoàn thành`}>
            <div className="w-full relative rounded-t overflow-hidden" style={{ height: `${pct}%`, backgroundColor: '#e0e7ff' }}>
              <div className="absolute bottom-0 left-0 right-0 rounded-t bg-primary-500 transition-all duration-500" style={{ height: `${cPct}%` }} />
            </div>
            <span className="text-[9px] text-slate-400 group-hover:text-slate-600 transition-colors">{d.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dept / Location Table Row ────────────────────────────────────────────────
function TableRow({ name, total, completed, rate, extra }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{name}</p>
        {extra && <p className="text-[10px] text-slate-400">{extra}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-slate-500">{completed}/{total}</span>
        <div className="w-16">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(rate, 100)}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 w-10 text-right">{rate}%</span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const Reports = ({ defaultTab = 'summary' }) => {
  const { toast, showLoading } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab selection
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]); // 'summary' or 'payroll'
  const [payrollData, setPayrollData] = useState(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(50000); // 50,000 VND/hour default
  // Dynamic calculation for Month / Year dropdown payroll cycle (26th of previous month to 25th of current month)
  const getInitialMonthYear = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    
    let initialMonth = month + 1; // 1-12
    let initialYear = year;
    
    if (day >= 26) {
      initialMonth = month === 11 ? 1 : month + 2;
      initialYear = month === 11 ? year + 1 : year;
    }
    return { month: initialMonth, year: initialYear };
  };

  const initialMonthYear = getInitialMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(initialMonthYear.month);
  const [selectedYear, setSelectedYear] = useState(initialMonthYear.year);

  const getRangeForMonth = (m, y) => {
    const monthIdx = m - 1;
    const prevMonth = monthIdx === 0 ? 11 : monthIdx - 1;
    const prevYear = monthIdx === 0 ? y - 1 : y;
    const fromStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-26`;
    const toStr = `${y}-${String(m).padStart(2, '0')}-25`;
    return { from: fromStr, to: toStr };
  };

  const { from: fromDate, to: toDate } = getRangeForMonth(selectedMonth, selectedYear);

  const getWeekdayName = (dateStr) => {
    const day = dayjs(dateStr).day();
    const names = {
      0: 'CN',
      1: 'T2',
      2: 'T3',
      3: 'T4',
      4: 'T5',
      5: 'T6',
      6: 'T7'
    };
    return names[day] || '';
  };  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportService.getReportsSummary({ fromDate, toDate });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const fetchPayrollData = useCallback(async () => {
    setLoadingPayroll(true);
    try {
      const localHolidays = localStorage.getItem('mock_holidays');
      const res = await reportService.getPayrollReport({ 
        fromDate, 
        toDate, 
        holidays: localHolidays 
      });
      setPayrollData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải bảng công tính lương');
    } finally {
      setLoadingPayroll(false);
    }
  }, [fromDate, toDate, toast]);

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchData();
    } else {
      fetchPayrollData();
    }
  }, [activeTab, fromDate, toDate, fetchData, fetchPayrollData]);

  // Print Summary Report
  const handlePrintSummary = () => {
    if (!data) return;
    const printWindow = window.open('', '_blank');
    
    const departmentRows = (data.byDepartment || []).map(d => `
      <tr>
        <td>${d.departmentName}</td>
        <td style="text-align: right;">${d.total}</td>
        <td style="text-align: right;">${d.completed}</td>
        <td style="text-align: right;">${d.completionRate}%</td>
        <td style="text-align: right;">${d.offlineSync}</td>
      </tr>
    `).join('');

    const locationRows = (data.byLocation || []).map(l => {
      const rate = l.total > 0 ? ((l.completed / l.total) * 100).toFixed(1) : 0;
      return `
        <tr>
          <td>${l.locationName}</td>
          <td style="text-align: right;">${l.total}</td>
          <td style="text-align: right;">${l.completed}</td>
          <td style="text-align: right;">${rate}%</td>
          <td style="text-align: right;">${l.offlineSync}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Báo cáo tổng hợp chấm công</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #333; }
            h1 { font-size: 22px; margin-bottom: 5px; color: #1e293b; }
            .date-range { font-size: 13px; color: #64748b; margin-bottom: 25px; }
            .section-title { font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #334155; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .stat-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background-color: #f8fafc; }
            .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
            .stat-value { font-size: 18px; font-weight: bold; margin-top: 3px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>Báo cáo tổng hợp chấm công</h1>
          <div class="date-range">Thời gian: Từ ${dayjs(fromDate).format('DD/MM/YYYY')} đến ${dayjs(toDate).format('DD/MM/YYYY')}</div>
          
          <div class="section-title">1. Số liệu tổng quan</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Tổng bản ghi phân công</div>
              <div class="stat-value">${data.attendance?.totalRecords ?? 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Hoàn thành chấm công</div>
              <div class="stat-value">${data.attendance?.completed ?? 0} (${data.attendance?.completionRate ?? 0}%)</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Chưa check-out</div>
              <div class="stat-value">${data.attendance?.notCheckedOut ?? 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Số nhân viên vắng mặt</div>
              <div class="stat-value">${data.attendance?.absentCount ?? 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Đồng bộ offline</div>
              <div class="stat-value">${data.attendance?.offlineSyncCount ?? 0}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Cần xét duyệt</div>
              <div class="stat-value">${data.review?.pending ?? 0}</div>
            </div>
          </div>

          <div class="section-title">2. Thống kê theo Phòng ban</div>
          <table>
            <thead>
              <tr>
                <th>Tên phòng ban</th>
                <th style="text-align: right;">Tổng số phân công</th>
                <th style="text-align: right;">Đã hoàn thành</th>
                <th style="text-align: right;">Tỷ lệ hoàn thành</th>
                <th style="text-align: right;">Đồng bộ Offline</th>
              </tr>
            </thead>
            <tbody>
              ${departmentRows || '<tr><td colspan="5" style="text-align: center;">Không có dữ liệu</td></tr>'}
            </tbody>
          </table>

          <div class="section-title">3. Thống kê theo Địa điểm</div>
          <table>
            <thead>
              <tr>
                <th>Tên địa điểm</th>
                <th style="text-align: right;">Tổng số phân công</th>
                <th style="text-align: right;">Đã hoàn thành</th>
                <th style="text-align: right;">Tỷ lệ hoàn thành</th>
                <th style="text-align: right;">Đồng bộ Offline</th>
              </tr>
            </thead>
            <tbody>
              ${locationRows || '<tr><td colspan="5" style="text-align: center;">Không có dữ liệu</td></tr>'}
            </tbody>
          </table>
          
          <p style="font-size: 10px; color: #94a3b8; text-align: right; margin-top: 30px;">Hệ thống Chấm công PWA - Xuất ngày ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Export Monthly Summary CSV/Excel
  const handleExportExcelSummary = () => {
    if (!data) return;
    
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    
    csvContent += `BÁO CÁO TỔNG HỢP CHẤM CÔNG\n`;
    csvContent += `Thời gian:,Từ ${dayjs(fromDate).format('DD/MM/YYYY')} đến ${dayjs(toDate).format('DD/MM/YYYY')}\n\n`;
    
    csvContent += `1. SỐ LIỆU TỔNG QUAN\n`;
    csvContent += `Chỉ số,Giá trị\n`;
    csvContent += `Tổng bản ghi phân công,${data.attendance?.totalRecords ?? 0}\n`;
    csvContent += `Đã hoàn thành,${data.attendance?.completed ?? 0}\n`;
    csvContent += `Tỷ lệ hoàn thành,${data.attendance?.completionRate ?? 0}%\n`;
    csvContent += `Chưa check-out,${data.attendance?.notCheckedOut ?? 0}\n`;
    csvContent += `Vắng mặt,${data.attendance?.absentCount ?? 0}\n`;
    csvContent += `Đồng bộ offline,${data.attendance?.offlineSyncCount ?? 0}\n`;
    csvContent += `Cần xét duyệt,${data.review?.pending ?? 0}\n\n`;
    
    csvContent += `2. THỐNG KÊ THEO PHÒNG BAN\n`;
    csvContent += `Tên phòng ban,Tổng số phân công,Đã hoàn thành,Tỷ lệ hoàn thành,Đồng bộ Offline\n`;
    (data.byDepartment || []).forEach(d => {
      csvContent += `"${d.departmentName}",${d.total},${d.completed},${d.completionRate}%,${d.offlineSync}\n`;
    });
    csvContent += `\n`;
    
    csvContent += `3. THỐNG KÊ THEO ĐỊA ĐIỂM\n`;
    csvContent += `Tên địa điểm,Tổng số phân công,Đã hoàn thành,Tỷ lệ hoàn thành,Đồng bộ Offline\n`;
    (data.byLocation || []).forEach(l => {
      const rate = l.total > 0 ? ((l.completed / l.total) * 100).toFixed(1) : 0;
      csvContent += `"${l.locationName}",${l.total},${l.completed},${rate}%,${l.offlineSync}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bao_cao_tong_hop_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Xuất báo cáo tổng hợp thành công!');
  };

  // Export Detailed Employee CSV/Excel
  const handleExportExcelDetails = async () => {
    try {
      showLoading(true);
      const res = await attendanceService.getAdminAttendance({
        fromDate,
        toDate,
        limit: 10000
      });
      
      if (!res || !res.success || !res.data || !res.data.items) {
        throw new Error('Không thể tải danh sách chấm công chi tiết');
      }

      const records = res.data.items;
      if (records.length === 0) {
        toast.info('Không có dữ liệu chấm công chi tiết trong khoảng thời gian này');
        return;
      }

      let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
      csvContent += `BÁO CÁO CHẤM CÔNG CHI TIẾT THEO TỪNG NHÂN VIÊN\n`;
      csvContent += `Thời gian:,Từ ${dayjs(fromDate).format('DD/MM/YYYY')} đến ${dayjs(toDate).format('DD/MM/YYYY')}\n\n`;
      
      csvContent += `Mã nhân viên,Họ và tên,Phòng ban,Ngày làm việc,Địa điểm,Giờ Check-in,Giờ Check-out,Trạng thái,Đồng bộ Offline,Hàng đợi duyệt,Rủi ro\n`;
      
      records.forEach(r => {
        const empCode = r.employee?.employeeCode || '';
        const empName = r.employee?.fullName || '';
        const deptName = r.employee?.departmentName || '';
        const workDate = dayjs(r.workDate).format('DD/MM/YYYY');
        const locName = r.location?.locationName || '';
        
        const checkIn = r.checkInTime ? dayjs(r.checkInTime).format('HH:mm:ss') : '—';
        const checkOut = r.checkOutTime ? dayjs(r.checkOutTime).format('HH:mm:ss') : 'N/A';
        
        let attendanceStatus = r.attendanceStatus;
        if (attendanceStatus === 'IN_PROGRESS') {
          const itemDate = dayjs(r.workDate).startOf('day');
          const today = dayjs().startOf('day');
          if (itemDate.isBefore(today)) {
            attendanceStatus = 'MISSED_CHECK_OUT';
          }
        }
        
        const statusMap = {
          COMPLETED: 'Hoàn thành',
          IN_PROGRESS: 'Đang làm việc',
          MISSED_CHECK_OUT: 'Quên check out',
          INVALID: 'Không hợp lệ',
          REVIEW_REQUIRED: 'Cần xét duyệt'
        };
        const statusText = statusMap[attendanceStatus] || attendanceStatus || '';
        
        const offlineText = r.isOfflineSync === 1 ? 'Có' : 'Không';
        
        const reviewMap = {
          PENDING: 'Chờ duyệt',
          APPROVED: 'Đã duyệt',
          REJECTED: 'Từ chối'
        };
        const reviewText = reviewMap[r.reviewStatus] || '—';
        
        const riskText = r.riskLevel || 'LOW';

        csvContent += `"${empCode}","${empName}","${deptName}",${workDate},"${locName}",${checkIn},${checkOut},"${statusText}",${offlineText},"${reviewText}","${riskText}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `bao_cao_chi_tiet_nhan_vien_${dayjs().format('YYYYMMDD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Xuất báo cáo chi tiết nhân viên thành công!');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xuất file báo cáo chi tiết');
    } finally {
      showLoading(false);
    }
  };

  const handleExportPayrollExcel = async () => {
    if (!payrollData) {
      toast.info('Chưa có dữ liệu bảng công để xuất');
      return;
    }

    try {
      showLoading(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ChamCong System';
      workbook.created = new Date();

      const monthStr = String(selectedMonth).padStart(2, '0');
      const sheetName = `Bảng công T${monthStr}-${selectedYear}`;
      const worksheet = workbook.addWorksheet(sheetName);

      // Page Setup for Printing (Landscape A4, Fit to Width)
      worksheet.pageSetup = {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
      };

      const dates = payrollData.dates || [];
      const totalCols = 4 + dates.length + 3; // STT, Mã NV, Họ tên, Phòng ban + dates + Tổng giờ, Ngày công, Tăng ca

      // 1. Title Row 1
      const titleRow = worksheet.addRow([`BẢNG CHẤM CÔNG VÀ TÍNH GIỜ CÔNG THÁNG ${dayjs(toDate).format('MM/YYYY')}`]);
      worksheet.mergeCells(1, 1, 1, totalCols);
      titleRow.height = 30;
      titleRow.getCell(1).font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FF0F172A' } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // 2. Subtitle Row 2
      const subTitleRow = worksheet.addRow([`Chu kỳ chấm công: Từ ngày ${dayjs(fromDate).format('DD/MM/YYYY')} đến ngày ${dayjs(toDate).format('DD/MM/YYYY')}`]);
      worksheet.mergeCells(2, 1, 2, totalCols);
      subTitleRow.height = 20;
      subTitleRow.getCell(1).font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
      subTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Empty row 3
      worksheet.addRow([]);

      // 3. Header Row 4 (Date Numbers) & Row 5 (Weekdays)
      const h1 = ['STT', 'Mã NV', 'Họ và tên', 'Phòng ban'];
      dates.forEach(d => h1.push(dayjs(d).format('DD')));
      h1.push('Tổng giờ công', 'Ngày công', 'Tổng giờ OT');

      const headerRow1 = worksheet.addRow(h1);
      headerRow1.height = 22;

      const h2 = ['', '', '', ''];
      dates.forEach(d => h2.push(getWeekdayName(d)));
      h2.push('', '', '');

      const headerRow2 = worksheet.addRow(h2);
      headerRow2.height = 20;

      // Merge fixed header columns vertically (Rows 4 & 5)
      worksheet.mergeCells(4, 1, 5, 1); // STT
      worksheet.mergeCells(4, 2, 5, 2); // Mã NV
      worksheet.mergeCells(4, 3, 5, 3); // Họ tên
      worksheet.mergeCells(4, 4, 5, 4); // Phòng ban
      worksheet.mergeCells(4, totalCols - 2, 5, totalCols - 2); // Tổng giờ
      worksheet.mergeCells(4, totalCols - 1, 5, totalCols - 1); // Ngày công
      worksheet.mergeCells(4, totalCols, 5, totalCols); // OT

      // Style Header Rows
      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8BC34A' } }; // Light green #8bc34a
      const headerFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      const thinBorder = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };

      for (let r = 4; r <= 5; r++) {
        const row = worksheet.getRow(r);
        for (let c = 1; c <= totalCols; c++) {
          const cell = row.getCell(c);
          cell.fill = headerFill;
          cell.font = headerFont;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = thinBorder;
        }
      }

      // Freeze Panes: Freeze top 5 rows & first 4 columns
      worksheet.views = [
        { state: 'frozen', xSplit: 4, ySplit: 5, activeCell: 'E6' }
      ];

      // Enable Auto Filter on Header Row 4
      worksheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: totalCols }
      };

      // 4. Populate Data Rows
      let rowIndex = 6;
      payrollData.items.forEach((emp, index) => {
        // --- Row 1: Regular shift ---
        const r1Data = [
          index + 1,
          emp.employeeCode || '',
          emp.fullName || '',
          emp.departmentName || ''
        ];

        dates.forEach(d => {
          const day = emp.days[d] || {};
          let char = '-';
          if (day.status === 'PRESENT') {
            const workHours = day.workHours !== undefined ? day.workHours : day.workingHours;
            char = (workHours !== undefined && workHours !== null && workHours > 0)
              ? formatHoursToHMM(workHours)
              : '-';
          } else if (day.status === 'LATE') {
            const workHours = day.workHours !== undefined ? day.workHours : day.workingHours;
            char = (day.checkOutTime && workHours) ? `T (${formatHoursToHMM(workHours)})` : 'T';
          } else if (['ON_LEAVE', 'LEAVE'].includes(day.status)) {
            char = 'P';
          } else if (['HOLIDAY', 'L'].includes(day.status)) {
            char = 'L';
          } else if (day.status === 'OFF') {
            char = 'OFF';
          } else if (['COMPENSATORY_LEAVE', 'COMPENSATORY', 'B'].includes(day.status)) {
            char = 'B';
          } else if (['ABSENT', 'KP'].includes(day.status)) {
            char = 'KP';
          }
          r1Data.push(char);
        });

        r1Data.push(
          formatHoursToHMM(emp.summary.totalWorkingHours),
          emp.summary.totalCompleted !== undefined ? emp.summary.totalCompleted : 0,
          formatHoursToHMM(emp.summary.totalOvertimeHours)
        );

        const mainRow = worksheet.addRow(r1Data);
        mainRow.height = 20;

        // Style Row 1 cells
        for (let colIdx = 1; colIdx <= totalCols; colIdx++) {
          const cell = mainRow.getCell(colIdx);
          cell.border = thinBorder;
          cell.font = { name: 'Arial', size: 9.5 };

          if (colIdx <= 4) {
            cell.alignment = { horizontal: colIdx === 1 ? 'center' : 'left', vertical: 'middle' };
            if (colIdx === 3) cell.font = { name: 'Arial', size: 9.5, bold: true };
          } else if (colIdx > 4 && colIdx <= 4 + dates.length) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            const val = String(cell.value || '');
            if (val === 'OFF') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } }; // Orange
              cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
            } else if (val.startsWith('T')) {
              cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFD97706' } }; // Amber
            } else if (['P', 'L', 'KP'].includes(val)) {
              cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFDC2626' } }; // Red
            } else if (val === 'B') {
              cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF7C3AED' } }; // Purple
            } else if (val !== '-') {
              cell.font = { name: 'Arial', size: 9.5, bold: true };
            }
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Arial', size: 10, bold: true };
          }
        }

        // --- Row 2: Overtime shift ---
        const r2Data = ['', '', '', ''];
        dates.forEach(d => {
          const day = emp.days[d] || {};
          const otHours = day.overtimeHours !== undefined ? day.overtimeHours : 0;
          r2Data.push(otHours > 0 ? formatHoursToHMM(otHours) : '-');
        });
        r2Data.push('', '', '');

        const otRow = worksheet.addRow(r2Data);
        otRow.height = 18;

        for (let colIdx = 1; colIdx <= totalCols; colIdx++) {
          const cell = otRow.getCell(colIdx);
          cell.border = thinBorder;
          cell.font = { name: 'Arial', size: 9 };

          if (colIdx > 4 && colIdx <= 4 + dates.length) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            const val = String(cell.value || '');
            if (val !== '-') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } }; // Yellow #fef08a
              cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF854D0E' } };
            } else {
              cell.font = { name: 'Arial', size: 9, color: { argb: 'FF94A3B8' } };
            }
          }
        }

        // Merge STT, Mã NV, Họ tên, Phòng ban, và Cột tổng kết cho 2 hàng AFTER both rows are added
        worksheet.mergeCells(rowIndex, 1, rowIndex + 1, 1);
        worksheet.mergeCells(rowIndex, 2, rowIndex + 1, 2);
        worksheet.mergeCells(rowIndex, 3, rowIndex + 1, 3);
        worksheet.mergeCells(rowIndex, 4, rowIndex + 1, 4);
        worksheet.mergeCells(rowIndex, totalCols - 2, rowIndex + 1, totalCols - 2);
        worksheet.mergeCells(rowIndex, totalCols - 1, rowIndex + 1, totalCols - 1);
        worksheet.mergeCells(rowIndex, totalCols, rowIndex + 1, totalCols);

        rowIndex += 2;
      });

      // 5. Legend Section at Bottom
      worksheet.addRow([]);
      worksheet.addRow([]);
      const legendTitleRow = worksheet.addRow(['Chú thích ký hiệu công:']);
      legendTitleRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };

      const legends = [
        '• OFF: Nghỉ tuần (Tô nền Da cam)',
        '• T: Đi muộn (Chữ Vàng/Cam đậm)',
        '• P: Nghỉ phép có đơn được duyệt (Chữ Đỏ)',
        '• L: Nghỉ lễ tết theo quy định (Chữ Đỏ)',
        '• KP: Nghỉ không phép (Chữ Đỏ)',
        '• B: Nghỉ bù (Chữ Tím)',
        '• Ô màu vàng (Dòng 2): Giờ làm tăng ca (OT)'
      ];

      legends.forEach(text => {
        const r = worksheet.addRow([text]);
        r.getCell(1).font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
      });

      // 6. Calculate Auto Widths
      worksheet.columns.forEach((col, idx) => {
        let maxLen = 0;
        col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
          if (rowNumber > 5) {
            const valStr = String(cell.value || '');
            if (valStr.length > maxLen) maxLen = valStr.length;
          }
        });

        if (idx === 0) col.width = 6;  // STT
        else if (idx === 1) col.width = 12; // Mã NV
        else if (idx === 2) col.width = Math.max(22, maxLen + 3); // Họ tên
        else if (idx === 3) col.width = Math.max(18, maxLen + 3); // Phòng ban
        else if (idx >= 4 && idx < 4 + dates.length) col.width = 8; // Dates
        else col.width = 15; // Totals
      });

      // Generate Buffer and download .xlsx
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Bang_cong_thang_${monthStr}_${selectedYear}.xlsx`);
      toast.success('Xuất file Excel thành công!');
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      toast.error('Lỗi khi xuất file Excel: ' + (err.message || 'Chưa rõ nguyên nhân'));
    } finally {
      showLoading(false);
    }
  };

  const handlePrintPayrollPDF = () => {
    if (!payrollData) return;
    const printWindow = window.open('', '_blank');

    const slipsHTML = payrollData.items.map(emp => {
      const salary = Math.round(emp.summary.totalWorkingHours * hourlyRate);
      return `
        <div class="slip-card">
          <div class="slip-header">
            <h2>PHIẾU LƯƠNG NHÂN VIÊN</h2>
            <div class="period">Kỳ thanh toán: ${dayjs(fromDate).format('DD/MM/YYYY')} - ${dayjs(toDate).format('DD/MM/YYYY')}</div>
          </div>
          <div class="slip-info">
            <p><strong>Họ và tên:</strong> ${emp.fullName}</p>
            <p><strong>Mã nhân viên:</strong> ${emp.employeeCode}</p>
            <p><strong>Phòng ban:</strong> ${emp.departmentName}</p>
          </div>
          <table class="slip-table">
            <thead>
              <tr>
                <th>Chỉ số công</th>
                <th style="text-align: right;">Số lượng / Giá trị</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Số ca được phân công</td>
                <td style="text-align: right;">${emp.summary.totalAssigned} ca</td>
              </tr>
              <tr>
                <td>Số ca hoàn thành công</td>
                <td style="text-align: right;">${emp.summary.totalCompleted} ca</td>
              </tr>
              <tr>
                <td>Số ngày đi đúng giờ</td>
                <td style="text-align: right;">${emp.summary.totalOnTime} ca</td>
              </tr>
              <tr>
                <td>Số ca trễ / về sớm</td>
                <td style="text-align: right;">${emp.summary.totalLateEarly} ca</td>
              </tr>
              <tr>
                <td>Số ca vắng mặt (không phép)</td>
                <td style="text-align: right;">${emp.summary.absent} ca</td>
              </tr>
              <tr class="highlight">
                <td>Tổng số giờ công thực tế</td>
                <td style="text-align: right;">${emp.summary.totalWorkingHours} giờ</td>
              </tr>
              <tr>
                <td>Đơn giá lương / giờ công</td>
                <td style="text-align: right;">${hourlyRate.toLocaleString('vi-VN')} đ/h</td>
              </tr>
              <tr class="total-row">
                <td>THÀNH TIỀN LƯƠNG TẠM TÍNH</td>
                <td style="text-align: right;">${salary.toLocaleString('vi-VN')} đ</td>
              </tr>
            </tbody>
          </table>
          <div class="slip-footer">
            <div class="signature-box">
              <p>Người nhận lương</p>
              <span class="sign-line">(Ký và ghi rõ họ tên)</span>
            </div>
            <div class="signature-box">
              <p>Người lập phiếu</p>
              <span class="sign-line">(Ký và ghi rõ họ tên)</span>
            </div>
          </div>
        </div>
        <div class="page-break"></div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Phiếu lương nhân viên</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; background-color: #fff; }
            .slip-card { border: 2px solid #e2e8f0; padding: 25px; border-radius: 12px; max-width: 600px; margin: 0 auto 40px auto; background-color: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.02); page-break-inside: avoid; }
            .slip-header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; }
            .slip-header h2 { font-size: 18px; margin: 0 0 5px 0; color: #0f172a; letter-spacing: 0.5px; }
            .period { font-size: 12px; color: #64748b; }
            .slip-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #f1f5f9; }
            .slip-info p { margin: 0; }
            .slip-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .slip-table th, .slip-table td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .slip-table th { background: #f8fafc; text-align: left; color: #475569; font-weight: 600; }
            .highlight { background: #f0fdf4; font-weight: bold; }
            .total-row { font-size: 14px; font-weight: bold; background: #f0fdf4; color: #15803d; border-top: 2px solid #bbf7d0; }
            .slip-footer { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; }
            .signature-box { text-align: center; width: 45%; }
            .signature-box p { font-size: 12px; font-weight: bold; margin: 0 0 50px 0; }
            .sign-line { font-size: 11px; color: #94a3b8; font-style: italic; }
            .page-break { page-break-after: always; }
            @media print {
              body { padding: 0; }
              .slip-card { border: none; padding: 0; box-shadow: none; max-width: 100%; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${slipsHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const att = data?.attendance;
  const face = data?.faceVerification;
  const wa = data?.webauthn;
  const review = data?.review;
  const risk = data?.risk;
  const trend = data?.dailyTrend;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {activeTab === 'payroll' ? (
              <>
                <FiCalendar className="w-5 h-5 text-primary-600" />
                Bảng công tháng
              </>
            ) : (
              <>
                <FiActivity className="w-5 h-5 text-primary-600" />
                Thống kê công nhân viên
              </>
            )}
          </h1>
          <p className="text-xs text-slate-505">
            {activeTab === 'payroll' 
              ? 'Quản lý và xuất dữ liệu chấm công hàng tháng của nhân viên' 
              : 'Biểu đồ và bảng thống kê chỉ số chấm công chi tiết của nhân viên'}
          </p>
        </div>
        {/* Month & Year Selection for 26th-25th payroll cycle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm">
            <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Tháng:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-slate-700 dark:text-slate-200 outline-none cursor-pointer font-semibold bg-white dark:bg-slate-800"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m} className="dark:bg-slate-800">Tháng {m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm">
            <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Năm:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-slate-700 dark:text-slate-200 outline-none cursor-pointer font-semibold bg-white dark:bg-slate-800"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                <option key={y} value={y} className="dark:bg-slate-800">{y}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-850 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-slate-750/50 shadow-sm font-medium">
            Chu kỳ: <span className="font-semibold text-primary-600 dark:text-primary-400">{dayjs(fromDate).format('DD/MM/YYYY')}</span> → <span className="font-semibold text-primary-600 dark:text-primary-400">{dayjs(toDate).format('DD/MM/YYYY')}</span>
          </div>

          <button
            onClick={activeTab === 'payroll' ? fetchPayrollData : fetchPayrollData}
            disabled={loadingPayroll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loadingPayroll ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={handleExportPayrollExcel}
            disabled={loadingPayroll || !payrollData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
          >
            <FiDownload className="w-3.5 h-3.5" />
            Xuất Excel
          </button>


        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Areas based on activeTab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Main Grid View Card */}
          <Card className="p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
            {loadingPayroll ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-6 w-full rounded" />
                <Skeleton className="h-24 w-full rounded animate-pulse" />
              </div>
            ) : !payrollData || payrollData.items.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Không có dữ liệu bảng công cho khoảng thời gian này
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                {/* Dynamic Title */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-center font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                  TẤT CẢ PHÒNG BAN - THÁNG {dayjs(toDate).format('MM/YYYY')}
                </div>

                <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200 dark:border-slate-800 text-left text-xs min-w-[1200px]">
                  <thead>
                    {/* Header Row 1 */}
                    <tr className="bg-[#8bc34a] text-slate-900 font-bold border-b border-slate-300 text-[10px] uppercase">
                      <th rowSpan={2} className="p-2 border-b border-r border-slate-300 text-center w-12 min-w-[48px] max-w-[48px] sticky left-0 bg-[#8bc34a] z-20">STT</th>
                      <th rowSpan={2} className="p-2 border-y border-l border-slate-300 border-r-2 border-r-slate-400/80 text-left w-48 min-w-[192px] max-w-[192px] sticky left-12 bg-[#8bc34a] z-20">Tên</th>
                      {payrollData.dates.map((d) => (
                        <th key={`day-num-${d}`} className="p-1 border-b border-r border-slate-300 text-center w-[50px] min-w-[50px] max-w-[50px] font-mono text-[10px]">
                          {dayjs(d).format('DD')}
                        </th>
                      ))}
                      <th rowSpan={2} className="p-2 border-b border-r border-slate-300 text-center w-24">Tổng số giờ</th>
                      <th rowSpan={2} className="p-2 border-b border-r border-slate-300 text-center w-24">Ngày công</th>
                    </tr>
                    {/* Header Row 2 */}
                    <tr className="bg-[#8bc34a] text-slate-900 font-bold border-b border-slate-300 text-[10px]">
                      {payrollData.dates.map((d) => (
                        <th key={`day-name-${d}`} className="p-1 border-b border-r border-slate-300 text-center w-[50px] min-w-[50px] max-w-[50px] font-mono text-[9px]">
                          {getWeekdayName(d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {payrollData.items.map((emp, index) => {
                      return (
                        <React.Fragment key={emp.employeeId}>
                          {/* Row 1: Regular shift / status */}
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 text-slate-800 dark:text-slate-200">
                            <td rowSpan={2} className="p-2 border-b border-r border-slate-200 dark:border-slate-800 font-bold text-center w-12 min-w-[48px] max-w-[48px] sticky left-0 bg-white dark:bg-slate-900 z-10">
                              {index + 1}
                            </td>
                            <td rowSpan={2} className="p-2 border-b border-r-2 border-r-slate-300 dark:border-r-slate-700 font-semibold sticky left-12 bg-white dark:bg-slate-900 z-10 w-48 min-w-[192px] max-w-[192px]">
                              <div className="w-[176px] max-w-[176px] truncate" title={emp.fullName}>
                                {emp.fullName}
                              </div>
                            </td>
                            {payrollData.dates.map((d) => {
                              const day = emp.days[d] || {};
                              let char = '-';
                              let colorClass = 'text-slate-400';
                              let bgClass = '';

                              if (day.status === 'PRESENT') {
                                const workHours = day.workHours !== undefined ? day.workHours : day.workingHours;
                                if (workHours !== undefined && workHours !== null) {
                                  if (workHours > 0 && workHours < 1) {
                                    char = `${Math.round(workHours * 60)}m`;
                                  } else {
                                    char = workHours;
                                  }
                                } else {
                                  char = '-';
                                }
                                colorClass = 'text-slate-800 dark:text-slate-200 font-semibold';
                              } else if (day.status === 'LATE') {
                                const workHours = day.workHours !== undefined ? day.workHours : day.workingHours;
                                if (day.checkOutTime && workHours !== undefined && workHours !== null) {
                                  const formattedHours = formatHoursToHMM(workHours);
                                  char = `T (${formattedHours})`;
                                } else {
                                  char = 'T';
                                }
                                colorClass = 'text-amber-500 font-bold';
                              } else if (day.status === 'ON_LEAVE' || day.status === 'LEAVE') {
                                char = 'P';
                                colorClass = 'text-red-500 font-bold';
                              } else if (day.status === 'HOLIDAY' || day.status === 'L') {
                                char = 'L';
                                colorClass = 'text-red-500 font-bold';
                              } else if (day.status === 'OFF') {
                                char = 'OFF';
                                colorClass = 'text-slate-900 font-bold';
                                bgClass = 'bg-amber-500';
                              } else if (day.status === 'COMPENSATORY_LEAVE' || day.status === 'COMPENSATORY' || day.status === 'B') {
                                char = 'B';
                                colorClass = 'text-slate-800 dark:text-slate-200 font-bold';
                              } else if (day.status === 'ABSENT' || day.status === 'KP') {
                                char = 'KP';
                                colorClass = 'text-red-500 font-bold';
                              }

                              let cursorClass = 'cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30';
                              const isCompensatory = ['COMPENSATORY_LEAVE', 'COMPENSATORY', 'B'].includes(day.status);
                              
                              let noteType = 'attendance';
                              let noteText = day.leaveReason || null;

                              if (day.status === 'KP') {
                                noteType = 'kp';
                                noteText = 'Nghỉ không phép (Không có đơn xin phép được phê duyệt)';
                              } else if (isCompensatory) {
                                noteType = 'compensatory';
                                noteText = noteText || 'Nghỉ bù theo đơn xin nghỉ phép đã được phê duyệt';
                              } else if (['ON_LEAVE', 'LEAVE'].includes(day.status)) {
                                noteType = 'leave';
                              } else if (['HOLIDAY', 'L'].includes(day.status)) {
                                noteType = 'holiday';
                                noteText = 'Nghỉ lễ theo quy định công ty';
                              } else if (day.status === 'LATE') {
                                noteType = 'late';
                              } else if (day.status === 'PRESENT') {
                                noteType = 'present';
                              }

                              const cellTitle = (day.checkInTime || day.checkOutTime)
                                ? `Vào: ${day.checkInTime || '--:--'} | Ra: ${day.checkOutTime || 'Chưa ra'}`
                                : (day.leaveReason || '');

                              const onClick = () => setSelectedNote({
                                type: noteType,
                                name: emp.fullName,
                                date: dayjs(d).format('DD/MM/YYYY'),
                                checkInTime: day.checkInTime,
                                checkOutTime: day.checkOutTime,
                                workHours: day.workHours !== undefined ? day.workHours : day.workingHours,
                                note: noteText
                              });

                              return (
                                <td 
                                  key={`r1-${d}`} 
                                  onClick={onClick}
                                  title={cellTitle}
                                  className={`py-1 px-0 border-b border-r border-slate-200 dark:border-slate-800 text-center font-mono text-[10px] w-[50px] min-w-[50px] max-w-[50px] ${colorClass} ${bgClass} ${cursorClass}`}
                                >
                                  <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                                    <span className={`font-bold whitespace-nowrap ${String(char).length > 7 ? 'text-[8.5px] tracking-tighter' : 'text-[10px]'}`}>{char}</span>
                                    {(day.checkInTime || day.checkOutTime) && (
                                      <span className="text-[7.5px] text-slate-500 font-semibold tracking-tighter whitespace-nowrap scale-90 -mt-0.5">
                                        {day.checkInTime || '--:--'}-{day.checkOutTime || '??'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            {/* Normal Shift Total Hours */}
                            <td className="p-2 border-b border-r border-slate-200 dark:border-slate-800 text-center font-bold font-mono text-slate-855 dark:text-slate-200">
                              {formatHoursToHMM(emp.summary.totalWorkingHours)}
                            </td>
                            {/* Normal Shift Total Days */}
                            <td className="p-2 border-b border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-855 dark:text-slate-200">
                              {emp.summary.totalCompleted !== undefined ? emp.summary.totalCompleted : 0}
                            </td>
                          </tr>

                          {/* Row 2: Overtime / Night shift */}
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-855/20 text-slate-855 dark:text-slate-255">
                            {payrollData.dates.map((d) => {
                              const day = emp.days[d] || {};
                              const otHours = day.overtimeHours !== undefined ? day.overtimeHours : 0;
                              const nightHours = day.nightHours !== undefined ? day.nightHours : 0;

                              let char = '-';
                              let colorClass = 'text-slate-350 dark:text-slate-650';
                              let bgClass = '';

                              if (otHours > 0) {
                                char = formatHoursToHMM(otHours);
                                bgClass = 'bg-yellow-300 dark:bg-yellow-600/50';
                                colorClass = 'text-slate-900 dark:text-slate-100 font-bold';
                              } else if (nightHours > 0) {
                                char = formatHoursToHMM(nightHours);
                                bgClass = 'bg-blue-600';
                                colorClass = 'text-white font-bold';
                              }

                              let cursorClass = '';
                              let onClick = null;
                              if (otHours > 0) {
                                cursorClass = 'cursor-pointer hover:opacity-85 transition-opacity';
                                onClick = () => setSelectedNote({
                                  type: 'ot',
                                  name: emp.fullName,
                                  date: dayjs(d).format('DD/MM/YYYY'),
                                  note: day.otReason
                                });
                              }

                              return (
                                <td 
                                  key={`r2-${d}`} 
                                  onClick={onClick}
                                  title={otHours > 0 ? `Tăng ca: ${otHours < 1 ? `${Math.round(otHours * 60)} phút` : `${otHours}h`}${day.otReason ? ` (${day.otReason})` : ''}` : ''}
                                  className={`py-1.5 px-0 border-b border-r border-slate-200 dark:border-slate-800 text-center font-mono text-[10px] w-[50px] min-w-[50px] max-w-[50px] ${colorClass} ${bgClass} ${cursorClass}`}
                                >
                                  <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                                    <span className="font-bold">{char}</span>
                                    {otHours > 0 && (day.otCheckInTime || day.otCheckOutTime) && (
                                      <span className="text-[7.5px] text-slate-900 font-semibold tracking-tighter whitespace-nowrap scale-90 -mt-0.5">
                                        {day.otCheckInTime || '--:--'}-{day.otCheckOutTime || '??'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            {/* OT Total Hours */}
                            <td className={`p-2 border-b border-r border-slate-200 dark:border-slate-800 text-center font-mono ${emp.summary.totalOvertimeHours > 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                              {formatHoursToHMM(emp.summary.totalOvertimeHours)}
                            </td>
                            {/* OT Total Days */}
                            <td className={`p-2 border-b border-r border-slate-200 dark:border-slate-800 text-center ${emp.summary.totalOvertimeDays > 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                              {emp.summary.totalOvertimeDays !== undefined ? emp.summary.totalOvertimeDays : 0}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Legend guide */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 text-xs">
              <div className="flex-1 p-2 bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 font-bold text-center rounded-xl border border-yellow-200 dark:border-yellow-900/30">
                Tăng ca: tô màu Vàng
              </div>
              <div className="flex-1 p-2 bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 font-bold text-center rounded-xl border border-blue-200 dark:border-blue-900/30">
                Ca đêm: tô màu Xanh dương
              </div>
            </div>

            <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Chú thích ký hiệu công
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-10 py-1 text-center bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 rounded font-bold text-amber-500">T</span>
                  <span className="text-slate-600 dark:text-slate-400">Đi muộn</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-10 py-1 text-center bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 rounded font-bold text-red-500">P</span>
                  <span className="text-slate-600 dark:text-slate-400">Nghỉ phép</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-10 py-1 text-center bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 rounded font-bold text-red-500">L</span>
                  <span className="text-slate-600 dark:text-slate-400">Nghỉ lễ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-10 py-1 text-center bg-amber-500 border border-amber-600 rounded font-bold text-slate-900">OFF</span>
                  <span className="text-slate-600 dark:text-slate-400">Nghỉ tuần</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-10 py-1 text-center bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 rounded font-bold text-slate-800 dark:text-slate-200">B</span>
                  <span className="text-slate-600 dark:text-slate-400">Nghỉ bù</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-10 py-1 text-center bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 rounded font-bold text-red-500">KP</span>
                  <span className="text-slate-600 dark:text-slate-400">Nghỉ KP</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'employee-stats' && (
        <div className="space-y-6">
          {/* Statistical Cards for Employee Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={FiUsers}
              label="Tổng nhân sự"
              value={payrollData ? payrollData.items.length : 0}
              color="primary"
              loading={loadingPayroll}
            />
            <StatCard
              icon={FiClock}
              label="Tổng giờ làm việc"
              value={payrollData ? formatHoursToHMM(payrollData.items.reduce((sum, item) => sum + (item.summary.totalWorkingHours || 0), 0)) : '0h'}
              color="green"
              loading={loadingPayroll}
            />
            <StatCard
              icon={FiTrendingUp}
              label="Tổng giờ tăng ca"
              value={payrollData ? formatHoursToHMM(payrollData.items.reduce((sum, item) => sum + (item.summary.totalOvertimeHours || 0), 0)) : '0h'}
              color="violet"
              loading={loadingPayroll}
            />
            <StatCard
              icon={FiAlertTriangle}
              label="Tổng số lần đi muộn"
              value={payrollData ? payrollData.items.reduce((sum, item) => sum + (item.summary.totalLate || 0), 0) : 0}
              color="amber"
              loading={loadingPayroll}
            />
          </div>

          {/* Simple CSS-based Charts */}
          {payrollData && payrollData.items.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Chỉ số chuyên cần bình quân
                </h3>
                <div className="space-y-4">
                  {(() => {
                    const totalAssigned = payrollData.items.reduce((sum, item) => sum + (item.summary.totalAssigned || 0), 0);
                    const totalCompleted = payrollData.items.reduce((sum, item) => sum + (item.summary.totalCompleted || 0), 0);
                    const totalOnTime = payrollData.items.reduce((sum, item) => sum + (item.summary.totalOnTime || 0), 0);
                    const attendanceRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
                    const onTimeRate = totalCompleted > 0 ? Math.round((totalOnTime / totalCompleted) * 100) : 0;
                    
                    return (
                      <>
                        <RateBar label="Tỷ lệ đi làm đầy đủ (Completed/Assigned)" rate={attendanceRate} color="#10b981" />
                        <RateBar label="Tỷ lệ đi làm đúng giờ (On-time/Completed)" rate={onTimeRate} color="#6366f1" />
                      </>
                    );
                  })()}
                </div>
              </Card>

              <Card className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Phân bổ vắng mặt & nghỉ phép
                </h3>
                <div className="space-y-4">
                  {(() => {
                    const totalAbsent = payrollData.items.reduce((sum, item) => sum + (item.summary.absent || 0), 0);
                    const totalLeave = payrollData.items.reduce((sum, item) => sum + (item.summary.leave || 0), 0);
                    const totalCompensatory = payrollData.items.reduce((sum, item) => sum + (item.summary.compensatoryLeave || 0), 0);
                    
                    const sumLeaves = totalAbsent + totalLeave + totalCompensatory;
                    const absentPct = sumLeaves > 0 ? Math.round((totalAbsent / sumLeaves) * 100) : 0;
                    const leavePct = sumLeaves > 0 ? Math.round((totalLeave / sumLeaves) * 100) : 0;
                    const compPct = sumLeaves > 0 ? Math.round((totalCompensatory / sumLeaves) * 100) : 0;
                    
                    return (
                      <>
                        <RateBar label="Vắng mặt (Không lý do)" rate={absentPct} color="#ef4444" />
                        <RateBar label="Nghỉ phép (Annual/Sick/Marriage)" rate={leavePct} color="#3b82f6" />
                        <RateBar label="Nghỉ bù (Compensatory)" rate={compPct} color="#8b5cf6" />
                      </>
                    );
                  })()}
                </div>
              </Card>
            </div>
          )}

          {/* Main Grid View Card */}
          <Card className="p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
            {loadingPayroll ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-6 w-full rounded" />
                <Skeleton className="h-24 w-full rounded animate-pulse" />
              </div>
            ) : !payrollData || payrollData.items.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Không có dữ liệu thống kê nhân viên cho khoảng thời gian này
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse text-left text-xs min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-150 dark:border-slate-800/80 text-slate-550 font-bold uppercase tracking-wider">
                      <th className="p-3 text-center w-12">STT</th>
                      <th className="p-3 w-28">Mã NV</th>
                      <th className="p-3 w-40">Họ và tên</th>
                      <th className="p-3 w-32">Phòng ban</th>
                      <th className="p-3 text-center w-24">Ngày công</th>
                      <th className="p-3 text-center w-24">Tổng giờ làm</th>
                      <th className="p-3 text-center w-24">Đúng giờ</th>
                      <th className="p-3 text-center w-24">Đi muộn</th>
                      <th className="p-3 text-center w-24">Về sớm</th>
                      <th className="p-3 text-center w-24">Nghỉ phép</th>
                      <th className="p-3 text-center w-24">Nghỉ lễ</th>
                      <th className="p-3 text-center w-24">Nghỉ bù</th>
                      <th className="p-3 text-center w-24">Tăng ca</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {payrollData.items.map((emp, index) => {
                      const holidayCount = emp.summary.holidayLeave !== undefined ? emp.summary.holidayLeave : 0;
                      return (
                        <tr key={emp.employeeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/20">
                          <td className="p-3 text-center font-medium">{index + 1}</td>
                          <td className="p-3 font-bold">{emp.employeeCode}</td>
                          <td className="p-3 font-semibold">{emp.fullName}</td>
                          <td className="p-3 text-slate-505">{emp.departmentName}</td>
                          <td className="p-3 text-center font-bold">{emp.summary.totalCompleted}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatHoursToHMM(emp.summary.totalWorkingHours)}
                          </td>
                          <td className="p-3 text-center font-semibold text-emerald-500">{emp.summary.totalOnTime}</td>
                          <td className="p-3 text-center font-semibold text-amber-500">{emp.summary.totalLate}</td>
                          <td className="p-3 text-center font-semibold text-amber-500">{emp.summary.totalEarlyLeave}</td>
                          <td className="p-3 text-center font-semibold text-blue-500">{emp.summary.annualLeave !== undefined ? emp.summary.annualLeave : emp.summary.leave}</td>
                          <td className="p-3 text-center font-semibold text-slate-400">
                            {holidayCount > 0 ? holidayCount : '-'}
                          </td>
                          <td className="p-3 text-center font-semibold text-purple-500">
                            {emp.summary.compensatoryLeave !== undefined ? emp.summary.compensatoryLeave : '-'}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-500">
                            {formatHoursToHMM(emp.summary.totalOvertimeHours)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
      {/* Note Detail Modal Overlay */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-left animate-slide-up">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedNote.type === 'ot'
                  ? 'bg-yellow-50 text-yellow-750 border border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400'
                  : selectedNote.type === 'compensatory'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400'
                  : selectedNote.type === 'kp'
                  ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400'
              }`}>
                {selectedNote.type === 'ot' 
                  ? 'Ghi chú tăng ca' 
                  : selectedNote.type === 'compensatory'
                  ? 'Nghỉ bù'
                  : selectedNote.type === 'kp' 
                  ? 'Nghỉ không phép' 
                  : selectedNote.type === 'holiday'
                  ? 'Nghỉ lễ'
                  : selectedNote.type === 'late'
                  ? 'Đi muộn'
                  : selectedNote.type === 'present'
                  ? 'Có điểm danh'
                  : 'Chi tiết điểm danh'}
              </span>
              <button 
                onClick={() => setSelectedNote(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedNote.name}</h4>
              {selectedNote.type !== 'compensatory' && (
                <p className="text-[10px] text-slate-500 font-semibold uppercase">{selectedNote.date}</p>
              )}
            </div>

            {(selectedNote.checkInTime || selectedNote.checkOutTime) && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-normal">Check-in:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedNote.checkInTime || '--:--'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-normal">Check-out:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedNote.checkOutTime || 'Chưa ra'}</span>
                </div>
                {selectedNote.workHours !== null && selectedNote.workHours !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-normal">Tổng:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">{selectedNote.workHours}h</span>
                  </div>
                )}
              </div>
            )}
            
            {selectedNote.note && (
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-350 italic font-medium min-h-[50px] whitespace-pre-line leading-relaxed">
                {selectedNote.note}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
