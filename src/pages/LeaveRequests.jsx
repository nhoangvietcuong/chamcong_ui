import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiFileText, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiClock, FiRotateCcw,
  FiExternalLink, FiXCircle
} from 'react-icons/fi';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import Input from '../components/Input';
import useApp from '../hooks/useApp';
import useAuth from '../hooks/useAuth';
import usePagination from '../hooks/usePagination';
import leaveService from '../services/leaveService';
import dayjs from 'dayjs';

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Nghỉ phép năm' },
  { value: 'COMPENSATORY', label: 'Nghỉ bù' },
  { value: 'SICK', label: 'Nghỉ bệnh' },
  { value: 'UNPAID', label: 'Nghỉ không lương' },
  { value: 'MARRIAGE', label: 'Nghỉ cưới' },
  { value: 'MATERNITY', label: 'Nghỉ thai sản' },
  { value: 'OTHER', label: 'Nghỉ khác' }
];

const LEAVE_TYPE_MAP = {
  ANNUAL: { label: 'Nghỉ phép năm', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30' },
  COMPENSATORY: { label: 'Nghỉ bù', color: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' },
  SICK: { label: 'Nghỉ bệnh', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
  UNPAID: { label: 'Nghỉ không lương', color: 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/30' },
  MARRIAGE: { label: 'Nghỉ cưới', color: 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30' },
  MATERNITY: { label: 'Nghỉ thai sản', color: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' },
  OTHER: { label: 'Nghỉ khác', color: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' }
};

const STATUS_MAP = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
  REJECTED: { label: 'Từ chối', color: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-50 text-slate-650 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/30' }
};

const EvidenceItem = ({ evidenceUrl }) => {
  const [hasError, setHasError] = useState(false);
  const fullUrl = evidenceUrl.startsWith('http') 
    ? evidenceUrl 
    : `${window.location.origin.replace(':5173', ':3000')}${evidenceUrl.startsWith('/') ? '' : '/'}${evidenceUrl}`;

  return (
    <div className="flex items-center justify-between p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs">
      <div className="flex items-center gap-3 min-w-0">
        {!hasError ? (
          <img 
            src={fullUrl}
            alt="Minh chứng" 
            onError={() => setHasError(true)}
            className="w-11 h-11 object-cover rounded-lg border border-indigo-200 dark:border-indigo-800 shrink-0 shadow-sm"
          />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
            <FiFileText className="w-5.5 h-5.5" />
          </div>
        )}
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 truncate">
            Tài liệu minh chứng đính kèm
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            {evidenceUrl.split('/').pop() || 'minh_chung_nghi_phep'}
          </span>
        </div>
      </div>
      <a 
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs"
      >
        <FiExternalLink className="w-3 h-3" />
        Xem ảnh gốc
      </a>
    </div>
  );
};

export const LeaveRequests = () => {
  const { toast } = useApp();
  const { role } = useAuth();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);

  // Bulk Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  
  // Single Modals
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        leaveType: typeFilter || undefined,
        status: statusFilter || undefined
      };
      
      const res = await leaveService.getAdminRequests(params);
      if (res && res.success && res.data) {
        setRequests(res.data.items || []);
        setTotal(res.data.pagination?.totalItems ?? res.data.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách đơn nghỉ phép');
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter, statusFilter, setTotal, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFilterType = (e) => {
    setTypeFilter(e.target.value);
    resetPagination();
    setSelectedIds([]);
  };

  const handleFilterStatus = (e) => {
    setStatusFilter(e.target.value);
    resetPagination();
    setSelectedIds([]);
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const allPendingSelected = pendingRequests.length > 0 && pendingRequests.every(r => selectedIds.includes(r.leaveRequestId));

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRequests.map(r => r.leaveRequestId));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openBulkModal = (type) => {
    if (selectedIds.length === 0) {
      return toast.warning('Vui lòng chọn ít nhất 1 đơn nghỉ phép');
    }
    setBulkActionType(type);
    setBulkRejectReason('');
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    if (bulkActionType === 'REJECT' && !bulkRejectReason.trim()) {
      return toast.warning('Vui lòng nhập lý do từ chối hàng loạt');
    }

    setBulkSubmitting(true);
    try {
      let res;
      if (bulkActionType === 'APPROVE') {
        res = await leaveService.bulkApprove(selectedIds);
      } else {
        res = await leaveService.bulkReject(selectedIds, bulkRejectReason.trim());
      }

      if (res && res.success && res.data) {
        const { successCount, failedCount } = res.data;
        if (failedCount > 0) {
          toast.warning(`Xử lý xong: ${successCount} đơn thành công, ${failedCount} đơn thất bại.`);
        } else {
          toast.success(`${bulkActionType === 'APPROVE' ? 'Duyệt' : 'Từ chối'} hàng loạt thành công ${successCount} đơn nghỉ phép!`);
        }
        setIsBulkModalOpen(false);
        setSelectedIds([]);
        setBulkRejectReason('');
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi xử lý hàng loạt');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const openRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      return toast.warning('Vui lòng nhập lý do từ chối');
    }
    try {
      const res = await leaveService.approveOrReject(rejectingId, 'REJECTED', { rejectReason });
      if (res && res.success) {
        toast.success('Từ chối đơn nghỉ phép thành công');
        setIsRejectOpen(false);
        setIsDetailOpen(false);
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thao tác');
    }
  };

  const getLeaveTypeDisplay = (type) => LEAVE_TYPE_MAP[type]?.label || type;
  const getStatusBadge = (status) => {
    const item = STATUS_MAP[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const selectedRequestsList = requests.filter(r => selectedIds.includes(r.leaveRequestId));

  const headers = [
    {
      key: 'checkbox',
      label: (
        <div className="flex items-center justify-center">
          {pendingRequests.length > 0 ? (
            <input 
              type="checkbox"
              checked={allPendingSelected}
              onChange={toggleSelectAllPending}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer accent-indigo-600"
              title="Chọn tất cả đơn đang chờ duyệt"
            />
          ) : (
            <span className="text-slate-300 dark:text-slate-700 font-bold text-xs select-none" title="Không có đơn nào đang chờ duyệt">–</span>
          )}
        </div>
      ),
      sortable: false,
      width: '50px'
    },
    { key: 'id', label: 'Mã đơn', sortable: false, width: '90px' },
    { key: 'employee', label: 'Nhân viên', sortable: false },
    { key: 'leaveType', label: 'Loại nghỉ', sortable: false, width: '130px' },
    { key: 'dates', label: 'Thời gian nghỉ', sortable: false },
    { key: 'status', label: 'Trạng thái', sortable: false, width: '125px' },
    { key: 'action', label: 'Thao tác', sortable: false, width: '140px' }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in relative pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-primary-600" />
            Kiểm duyệt nghỉ phép
          </h1>
          <p className="text-xs text-slate-500">Phê duyệt hoặc từ chối đơn xin nghỉ phép của nhân viên, hệ thống tự động đồng bộ bảng công</p>
        </div>
        
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors disabled:opacity-60 bg-white dark:bg-slate-900 cursor-pointer font-semibold shadow-sm"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filters Card */}
      <Card className="p-4 border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            name="leaveType"
            value={typeFilter}
            onChange={handleFilterType}
            options={[
              ...LEAVE_TYPES
            ]}
            placeholder="Tất cả các loại nghỉ"
          />
          
          <Select
            name="status"
            value={statusFilter}
            onChange={handleFilterStatus}
            options={[
              { value: 'PENDING', label: 'Đang chờ duyệt (PENDING)' },
              { value: 'APPROVED', label: 'Đã phê duyệt (APPROVED)' },
              { value: 'REJECTED', label: 'Đã từ chối (REJECTED)' },
              { value: 'CANCELLED', label: 'Đã hủy bỏ (CANCELLED)' }
            ]}
            placeholder="Tất cả trạng thái"
          />
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="flex flex-col gap-5">
        <Table
          headers={headers}
          items={requests}
          loading={loading}
          emptyState={
            <Card className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white dark:bg-slate-900 border-none">
              <FiFileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Không tìm thấy yêu cầu nghỉ phép nào</p>
              <p className="text-xs text-slate-400">Chưa có nhân viên nào gửi đơn hoặc bộ lọc tìm kiếm của bạn không trùng khớp</p>
            </Card>
          }
          renderRow={(req) => {
            const isPending = req.status === 'PENDING';
            const isChecked = selectedIds.includes(req.leaveRequestId);
            return (
              <>
                <td className="px-4 py-4 text-center">
                  {isPending ? (
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectRow(req.leaveRequestId)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer accent-indigo-600"
                      title="Chọn đơn này"
                    />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-700 font-bold text-xs select-none" title="Đơn này đã được xử lý">–</span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                  #{req.leaveRequestId}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{req.employeeFullName || req.fullName}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{req.employeeCode} ({req.departmentName || 'Không có phòng ban'})</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${LEAVE_TYPE_MAP[req.leaveType]?.color || 'bg-slate-50'}`}>
                    {getLeaveTypeDisplay(req.leaveType)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-slate-700 dark:text-slate-350 font-medium text-left">
                    <span>{dayjs(req.startDate).format('DD/MM/YYYY')} ➜ {dayjs(req.endDate).format('DD/MM/YYYY')}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Số ngày nghỉ: {dayjs(req.endDate).diff(dayjs(req.startDate), 'day') + 1} ngày</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(req.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsDetailOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-650 text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-slate-900 whitespace-nowrap"
                    >
                      <FiFileText className="w-3.5 h-3.5" />
                      Xem chi tiết
                    </button>
                  </div>
                </td>
              </>
            );
          }}
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

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && !isBulkModalOpen && !isDetailOpen && !isRejectOpen && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-slide-up pointer-events-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-r border-slate-700 pr-4">
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[11px] font-bold">
              {selectedIds.length}
            </span>
            <span>Đã chọn {selectedIds.length} đơn</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openBulkModal('APPROVE')}
              className="px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FiCheck className="w-3.5 h-3.5" />
              Duyệt hàng loạt
            </button>

            <button
              onClick={() => openBulkModal('REJECT')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
              Từ chối hàng loạt
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

           {/* Bulk Action Confirmation Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title={bulkActionType === 'APPROVE' 
          ? `Kiểm tra & Duyệt hàng loạt (${selectedIds.length} đơn nghỉ phép)` 
          : `Kiểm tra & Từ chối hàng loạt (${selectedIds.length} đơn nghỉ phép)`}
        size="lg"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4 text-left">

          {/* List of Selected Requests with Details, Reasons, Evidence & Remove button */}
          <div className="max-h-[320px] sm:max-h-[350px] overflow-y-auto space-y-3 pr-1">
            {selectedRequestsList.map((req) => (
              <div 
                key={req.leaveRequestId}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      #{req.leaveRequestId}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {req.employeeFullName || req.fullName || 'Nhân viên'}
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-mono">({req.employeeCode} - {req.departmentName || 'Chưa xếp phòng ban'})</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${LEAVE_TYPE_MAP[req.leaveType]?.color || 'bg-slate-100'}`}>
                      {getLeaveTypeDisplay(req.leaveType)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newIds = selectedIds.filter(id => id !== req.leaveRequestId);
                        setSelectedIds(newIds);
                        if (newIds.length === 0) {
                          setIsBulkModalOpen(false);
                          toast.info('Đã hủy chọn tất cả các đơn');
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      title="Bỏ đơn này khỏi danh sách duyệt"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-650 dark:text-slate-350 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-slate-400">Thời gian xin nghỉ:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {dayjs(req.startDate).format('DD/MM/YYYY')} ➜ {dayjs(req.endDate).format('DD/MM/YYYY')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Tổng số ngày:</span>{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {dayjs(req.endDate).diff(dayjs(req.startDate), 'day') + 1} ngày
                    </strong>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-400 block text-[10px] uppercase mb-0.5">Lý do nghỉ phép:</span>
                  <span className="italic">“{req.reason || 'Không có lý do chi tiết'}”</span>
                </div>

                {/* Evidence Image Thumbnail */}
                {req.evidenceUrl && (
                  <EvidenceItem evidenceUrl={req.evidenceUrl} />
                )}
              </div>
            ))}
          </div>

          {/* If Rejecting, Require Reject Reason */}
          {bulkActionType === 'REJECT' && (
            <div className="pt-2">
              <Input
                label="Lý do từ chối hàng loạt (áp dụng cho tất cả các đơn được chọn)"
                type="text"
                placeholder="Vui lòng nhập lý do từ chối..."
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                maxLength={100}
                required
                autoFocus
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 pb-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-medium shrink-0">
              Tổng: <strong className="text-slate-800 dark:text-slate-200 font-bold">{selectedIds.length}</strong> đơn
            </span>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                disabled={bulkSubmitting}
                className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={bulkSubmitting}
                className={`px-4.5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  bulkActionType === 'APPROVE' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98' 
                    : 'bg-rose-600 hover:bg-rose-700 active:scale-98'
                } disabled:opacity-50`}
              >
                {bulkSubmitting && <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {bulkActionType === 'APPROVE' 
                  ? `Xác nhận duyệt (${selectedIds.length} đơn)` 
                  : `Xác nhận từ chối (${selectedIds.length} đơn)`}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Single Reject Reason Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title={selectedRequest?.leaveType === 'COMPENSATORY' ? "Từ chối đơn xin nghỉ bù" : "Từ chối đơn xin nghỉ phép"}
        size="sm"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-left">
          <div>
            <Input
              label="Lý do từ chối"
              type="text"
              placeholder="Vui lòng nhập lý do từ chối để nhân viên biết lý do (tối đa 100 ký tự)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={100}
              required
              autoFocus
            />
            <div className="flex justify-end pr-1 mt-1">
              <span className="text-[10px] text-slate-400 font-medium">
                {(rejectReason || '').length}/100 ký tự
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRejectOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              Xác nhận từ chối
            </button>
          </div>
        </form>
      </Modal>

      {/* Leave Request Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRequest(null);
        }}
        title={selectedRequest?.leaveType === 'COMPENSATORY' ? "Chi tiết đơn xin nghỉ bù" : "Chi tiết đơn xin nghỉ phép"}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-5 text-left">
            {/* Employee Info Header */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F0F2FF] border border-[#E0E4FF]">
              <div className="w-12 h-12 rounded-full bg-[#C7D2FE] text-[#4F46E5] flex items-center justify-center font-bold text-base shrink-0">
                {selectedRequest.employeeFullName ? selectedRequest.employeeFullName.substring(0, 2).toUpperCase() : 'NV'}
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-sm font-bold text-slate-800">{selectedRequest.employeeFullName}</h3>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Mã nhân viên: <strong>{selectedRequest.employeeCode}</strong> &nbsp;•&nbsp; Phòng ban: <strong>{selectedRequest.departmentName || 'Không có'}</strong>
                </span>
              </div>
            </div>

            {/* Side-by-side Type and Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm text-left flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại hình nghỉ phép:</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap ${LEAVE_TYPE_MAP[selectedRequest.leaveType]?.color || 'bg-slate-50'}`}>
                  {getLeaveTypeDisplay(selectedRequest.leaveType)}
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm text-left flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái duyệt:</span>
                <div className="w-fit">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>

            {/* Date range Card */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm text-left flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian nghỉ:</span>
              <div className="flex items-center justify-between px-6 py-1">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {dayjs(selectedRequest.startDate).format('DD/MM/YYYY')}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Bắt đầu</span>
                </div>
                
                <span className="text-slate-300 text-base font-light">➜</span>
                
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {dayjs(selectedRequest.endDate).format('DD/MM/YYYY')}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Kết thúc</span>
                </div>
              </div>
            </div>

            {/* Total Days Card */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Tổng số ngày nghỉ:</span>
              <span className="text-sm font-bold text-[#4F46E5] dark:text-[#6366F1]">
                {dayjs(selectedRequest.endDate).diff(dayjs(selectedRequest.startDate), 'day') + 1} ngày
              </span>
            </div>

            {/* Leave Reason Card */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lý do nghỉ phép:</span>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed font-medium shadow-sm">
                “{selectedRequest.reason || 'Không có lý do chi tiết'}”
              </div>
            </div>

            {/* Evidence Image Block */}
            {selectedRequest.evidenceUrl && (
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ảnh minh chứng kèm theo:</span>
                <div className="border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 p-2 w-full shadow-sm">
                  <a 
                    href={selectedRequest.evidenceUrl.startsWith('http') ? selectedRequest.evidenceUrl : `${window.location.origin.replace(':5173', ':3000')}${selectedRequest.evidenceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <img 
                      src={selectedRequest.evidenceUrl.startsWith('http') ? selectedRequest.evidenceUrl : `${window.location.origin.replace(':5173', ':3000')}${selectedRequest.evidenceUrl}`}
                      alt="Ảnh minh chứng" 
                      className="w-full h-auto rounded-lg object-contain max-h-[500px] shadow-sm hover:scale-[1.005] transition-transform mx-auto"
                    />
                  </a>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center font-medium">Click vào ảnh để phóng to ở tab mới</p>
                </div>
              </div>
            )}

            {/* Timeline history */}
            <div className="space-y-3 text-left pt-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Lịch sử xử lý</span>
              
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-4 ml-2 pt-1">
                {/* Approved/Rejected or Cancelled step */}
                {selectedRequest.status !== 'PENDING' && (
                  <div className="relative">
                    {/* Icon bullet */}
                    <div className="absolute -left-[30px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-white dark:border-slate-950 shadow-sm">
                      <FiClock className="w-2 h-2 text-slate-500" />
                    </div>
                    
                    <div className="flex flex-col text-xs">
                      <span className="text-slate-600 dark:text-slate-350">
                        {selectedRequest.status === 'APPROVED' ? (
                          <>Đã phê duyệt bởi <strong className="text-[#4F46E5] dark:text-[#6366F1]">Quản lý</strong></>
                        ) : selectedRequest.status === 'REJECTED' ? (
                          <>Đã từ chối bởi <strong className="text-[#4F46E5] dark:text-[#6366F1]">Quản lý</strong>{selectedRequest.rejectReason && <span className="text-rose-500 font-semibold block mt-0.5">Lý do: {selectedRequest.rejectReason}</span>}</>
                        ) : (
                          <>Đã hủy bởi <strong className="text-[#4F46E5] dark:text-[#6366F1]">{selectedRequest.employeeFullName}</strong></>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {dayjs(selectedRequest.updatedAt || selectedRequest.createdAt).format('DD/MM/YYYY • HH:mm')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Created step */}
                <div className="relative">
                  {/* Icon bullet */}
                  <div className="absolute -left-[30px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-white dark:border-slate-950 shadow-sm">
                    <FiCheck className="w-2 h-2 text-slate-500" />
                  </div>
                  
                  <div className="flex flex-col text-xs">
                    <span className="text-slate-600 dark:text-slate-350">
                      Được yêu cầu bởi <strong className="text-[#4F46E5] dark:text-[#6366F1]">{selectedRequest.employeeFullName}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {dayjs(selectedRequest.createdAt).format('DD/MM/YYYY • HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions block inside Modal */}
            {selectedRequest.status === 'PENDING' && (role === 'ADMIN' || role === 'SUPMANAGER') && (
              <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  onClick={async () => {
                    if (window.confirm('Xác nhận phê duyệt đơn nghỉ phép này?')) {
                      try {
                        const res = await leaveService.approveOrReject(selectedRequest.leaveRequestId, 'APPROVED');
                        if (res && res.success) {
                          toast.success('Phê duyệt đơn nghỉ phép thành công');
                          setIsDetailOpen(false);
                          setSelectedRequest(null);
                          fetchRequests();
                        }
                      } catch (err) {
                        toast.error(err.message || 'Lỗi phê duyệt');
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer border border-transparent"
                >
                  <FiCheck className="w-4 h-4" />
                  Phê duyệt đơn
                </button>
                <button
                  onClick={() => {
                    setRejectingId(selectedRequest.leaveRequestId);
                    setIsRejectOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer border border-transparent"
                >
                  <FiX className="w-4 h-4" />
                  Từ chối đơn
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveRequests;
