import React, { useState, useEffect, useCallback } from 'react';
import {
  FiCheckSquare, FiUserCheck, FiXCircle, FiAlertTriangle,
  FiMapPin, FiCalendar, FiWifi, FiRefreshCw, FiImage,
  FiClock, FiShield, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import dayjs from 'dayjs';
import Card from '../components/Card';
import useApp from '../hooks/useApp';
import reviewQueueService from '../services/reviewQueueService';
import dashboardService from '../services/dashboardService';

// ─── Risk Badge ────────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const map = {
    NO_GPS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300',
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
    LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200',
  };
  const labelMap = {
    NO_GPS: 'NO GPS (Mất sóng)',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${map[level] ?? map.LOW}`}>
      <FiAlertTriangle className="w-2.5 h-2.5" />
      {labelMap[level] ?? level}
    </span>
  );
}

// ─── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ item, deadlineTime = '22:00', onApprove, onReject, submitting, onImageClick }) {
  const [note, setNote] = useState('');
  const distExceeded = item.checkInDistanceMeter > item.allowedRadiusMeter;

  const timeForCheck = item.clientCheckInTime || item.checkInTime;
  const checkInTimeStr = timeForCheck ? dayjs(timeForCheck).format('HH:mm') : null;
  const deadline = deadlineTime || '22:00';
  const isAfterDeadline = checkInTimeStr ? checkInTimeStr > deadline : false;

  return (
    <Card className="flex flex-col gap-4 border border-amber-100 dark:border-amber-900/30">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-sm font-bold flex-shrink-0 uppercase">
            {item.employee.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.employee.fullName}</span>
              <span className="text-[10px] font-mono text-slate-400">({item.employee.employeeCode})</span>
              <RiskBadge level={item.riskLevel} />
              {item.isOfflineSync && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200">
                  <FiWifi className="w-2.5 h-2.5" /> Offline Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{item.department.departmentName}</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 space-y-0.5 flex-shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <FiCalendar className="w-3 h-3" />
            <span>{dayjs(item.workDate).format('DD/MM/YYYY')}</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <FiClock className="w-3 h-3" />
            <span>{dayjs(item.checkInTime).format('HH:mm')} — {item.checkOutTime ? dayjs(item.checkOutTime).format('HH:mm') : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Location + GPS info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="col-span-1 sm:col-span-2 flex flex-col gap-2">
          <div className="flex items-start gap-2 text-xs">
            <FiMapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{item.workLocation.locationName}</span>
              <p className="text-slate-400 text-[10px]">{item.workLocation.address}</p>
            </div>
          </div>

          {/* GPS bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Khoảng cách GPS (Check-in)</span>
              <span className={`font-semibold ${distExceeded ? 'text-red-600' : 'text-green-600'}`}>
                {item.checkInDistanceMeter?.toFixed(0) ?? '?'}m / cho phép {item.allowedRadiusMeter}m
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${distExceeded ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((item.checkInDistanceMeter / Math.max(item.allowedRadiusMeter * 2, 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <FiShield className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500">Trust score: <strong className={`${item.locationTrustScore >= 70 ? 'text-green-600' : 'text-red-500'}`}>{item.locationTrustScore ?? '—'}/100</strong></span>
            </div>
          </div>

          {/* Photos */}
          <div className="flex gap-2 mt-1 flex-wrap">
            {item.checkInPhotoUrl && (
              <div 
                className="flex flex-col items-center gap-1 text-[10px] text-slate-500 border border-dashed rounded-lg p-1 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 transition-colors relative group"
                onClick={() => onImageClick(`${item.checkInPhotoUrl}?token=${localStorage.getItem('accessToken')}`)}
              >
                <img
                  src={`${item.checkInPhotoUrl}?token=${localStorage.getItem('accessToken')}`}
                  alt="Check-in"
                  className="w-24 h-24 object-cover rounded-md group-hover:opacity-80 transition-opacity"
                />
                <span>Ảnh check-in</span>
              </div>
            )}
            {item.checkInVerificationPhotoUrl && (
              <div 
                className="flex flex-col items-center gap-1 text-[10px] text-slate-500 border border-dashed rounded-lg p-1 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 transition-colors relative group"
                onClick={() => onImageClick(`${item.checkInVerificationPhotoUrl}?token=${localStorage.getItem('accessToken')}`)}
              >
                <img
                  src={`${item.checkInVerificationPhotoUrl}?token=${localStorage.getItem('accessToken')}`}
                  alt="Check-in Verification"
                  className="w-24 h-24 object-cover rounded-md group-hover:opacity-80 transition-opacity"
                />
                <span>Xác thực vị trí (In)</span>
              </div>
            )}
            {item.checkOutPhotoUrl && (
              <div 
                className="flex flex-col items-center gap-1 text-[10px] text-slate-500 border border-dashed rounded-lg p-1 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 transition-colors relative group"
                onClick={() => onImageClick(`${item.checkOutPhotoUrl}?token=${localStorage.getItem('accessToken')}`)}
              >
                <img
                  src={`${item.checkOutPhotoUrl}?token=${localStorage.getItem('accessToken')}`}
                  alt="Check-out"
                  className="w-24 h-24 object-cover rounded-md group-hover:opacity-80 transition-opacity"
                />
                <span>Ảnh check-out</span>
              </div>
            )}
            {item.checkOutVerificationPhotoUrl && (
              <div 
                className="flex flex-col items-center gap-1 text-[10px] text-slate-500 border border-dashed rounded-lg p-1 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 transition-colors relative group"
                onClick={() => onImageClick(`${item.checkOutVerificationPhotoUrl}?token=${localStorage.getItem('accessToken')}`)}
              >
                <img
                  src={`${item.checkOutVerificationPhotoUrl}?token=${localStorage.getItem('accessToken')}`}
                  alt="Check-out Verification"
                  className="w-24 h-24 object-cover rounded-md group-hover:opacity-80 transition-opacity"
                />
                <span>Xác thực vị trí (Out)</span>
              </div>
            )}
          </div>
        </div>

        {/* Attendance ID */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex flex-col gap-1.5 text-[11px] text-slate-500">
          <div className="flex justify-between">
            <span>ID chấm công</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">#{item.attendanceId}</span>
          </div>
          <div className="flex justify-between">
            <span>Trạng thái</span>
            <span className="font-semibold text-amber-600">Chờ duyệt</span>
          </div>
          <div className="flex justify-between">
            <span>Thời hạn nộp</span>
            <span className={isAfterDeadline ? 'font-semibold text-red-600 dark:text-red-400' : 'font-semibold text-emerald-600 dark:text-emerald-400'}>
              {isAfterDeadline ? `Quá hạn (Sau ${deadline})` : `Đúng hạn (Trước ${deadline})`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Offline sync</span>
            <span className={item.isOfflineSync ? 'text-violet-600 font-semibold' : 'text-slate-400'}>{item.isOfflineSync ? 'Có' : 'Không'}</span>
          </div>
          <div className="mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-start gap-1">
            <FiAlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
            <span>Lý do duyệt: {item.reviewNote || (item.riskLevel === 'NO_GPS' ? 'Chấm công No-GPS (Mất sóng/Tắt GPS)' : (item.isOfflineSync ? 'Chấm công ngoại tuyến' : 'Cần kiểm tra vị trí'))}</span>
          </div>
        </div>
      </div>

      {/* Note + action row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ghi chú duyệt / từ chối (tùy chọn, tối đa 500 ký tự)..."
          maxLength={500}
          className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-300 transition-shadow"
        />
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onApprove(item.attendanceId, note)}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
          >
            <FiUserCheck className="w-3.5 h-3.5" />
            Duyệt
          </button>
          <button
            onClick={() => onReject(item.attendanceId, note)}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
          >
            <FiXCircle className="w-3.5 h-3.5" />
            Từ chối
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const ReviewQueue = () => {
  const { toast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deadlineTime, setDeadlineTime] = useState('22:00');
  const limit = 5;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await dashboardService.getSettings();
        if (res && res.success && res.data && res.data.offlineSubmissionDeadline) {
          setDeadlineTime(res.data.offlineSubmissionDeadline);
        }
      } catch (err) {
        // use default 22:00
      }
    };
    fetchSettings();
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewQueueService.getReviewQueue({ page, limit });
      if (res.success) {
        setItems(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách kiểm duyệt');
    } finally {
      setLoading(false);
    }
  }, [page, limit, toast]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleReview = async (attendanceId, note, reviewStatus) => {
    setSubmitting(true);
    try {
      const res = await reviewQueueService.reviewAttendance(attendanceId, { reviewStatus, reviewNote: note });
      if (res.success) {
        toast.success(reviewStatus === 'APPROVED' ? 'Đã duyệt chấm công thành công!' : 'Đã từ chối chấm công!');
        // Remove the reviewed item from list optimistically
        setItems(prev => prev.filter(i => i.attendanceId !== attendanceId));
        setTotal(prev => prev - 1);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật kiểm duyệt');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiCheckSquare className="w-5 h-5 text-primary-600" />
            Danh sách kiểm duyệt chấm công
          </h1>
          <p className="text-xs text-slate-500">Phê duyệt hoặc từ chối các yêu cầu chấm công bị nghi ngờ về địa điểm GPS hoặc offline sync</p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold">
              {total} bản ghi chờ duyệt
            </span>
          )}
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <FiCheckSquare className="w-7 h-7 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Không còn bản ghi nào chờ duyệt</p>
          <p className="text-xs text-slate-400">Tất cả yêu cầu chấm công đã được xử lý</p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {items.map(item => (
              <ReviewCard
                key={item.attendanceId}
                item={item}
                deadlineTime={deadlineTime}
                onApprove={(id, note) => handleReview(id, note, 'APPROVED')}
                onReject={(id, note) => handleReview(id, note, 'REJECTED')}
                submitting={submitting}
                onImageClick={setSelectedImage}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">Trang {page}/{totalPages} — {total} bản ghi</p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen animate-scale-up" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
              <FiXCircle className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain border-2 border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
