import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiFileText, FiCheck, FiX, FiRefreshCw, FiClock, FiAlertCircle, FiXCircle
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
import otService from '../services/otService';
import dayjs from 'dayjs';

const STATUS_MAP = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
  REJECTED: { label: 'Từ chối', color: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-50 text-slate-650 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/30' }
};

export const OvertimeRequests = () => {
  const { toast } = useApp();
  const { role } = useAuth();
  const { page, setPage, limit, total, setTotal, resetPagination } = usePagination(10);
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Bulk Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('APPROVE');
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  
  // Single Action Modals
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        status: statusFilter || undefined,
        workDate: dateFilter || undefined
      };
      
      const res = await otService.getAdminRequests(params);
      if (res && res.success && res.data) {
        setRequests(res.data || []);
        setTotal(res.pagination?.totalItems ?? res.pagination?.total ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách đơn đăng ký tăng ca');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, dateFilter, setTotal, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFilterStatus = (e) => {
    setStatusFilter(e.target.value);
    setSelectedIds([]);
    resetPagination();
  };

  const handleFilterDate = (e) => {
    setDateFilter(e.target.value);
    setSelectedIds([]);
    resetPagination();
  };

  // Multi-select logic
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const allPendingSelected = pendingRequests.length > 0 && pendingRequests.every(r => selectedIds.includes(r.otRequestId));

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRequests.map(r => r.otRequestId));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openBulkModal = (type) => {
    if (selectedIds.length === 0) {
      return toast.warning('Vui lòng chọn ít nhất 1 đơn đăng ký tăng ca');
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
        res = await otService.bulkApprove(selectedIds);
      } else {
        res = await otService.bulkReject(selectedIds, bulkRejectReason.trim());
      }

      if (res && res.success && res.data) {
        const { successCount, failedCount } = res.data;
        if (failedCount > 0) {
          toast.warning(`Xử lý xong: ${successCount} đơn thành công, ${failedCount} đơn thất bại.`);
        } else {
          toast.success(`${bulkActionType === 'APPROVE' ? 'Duyệt' : 'Từ chối'} hàng loạt thành công ${successCount} đơn tăng ca!`);
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

  const handleApprove = async (id) => {
    if (!window.confirm('Xác nhận phê duyệt yêu cầu tăng ca này?')) return;
    try {
      const res = await otService.approveRequest(id);
      if (res && res.success) {
        toast.success('Phê duyệt yêu cầu tăng ca thành công');
        setIsDetailOpen(false);
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi duyệt đơn tăng ca');
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
      const res = await otService.rejectRequest(rejectingId, rejectReason);
      if (res && res.success) {
        toast.success('Từ chối đơn tăng ca thành công');
        setIsRejectOpen(false);
        setIsDetailOpen(false);
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi thao tác từ chối đơn tăng ca');
    }
  };

  const getStatusBadge = (status) => {
    const item = STATUS_MAP[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const selectedRequestsList = requests.filter(r => selectedIds.includes(r.otRequestId));

  const headers = [
    {
      key: 'select_all',
      label: (
        <div className="flex items-center justify-center">
          {pendingRequests.length > 0 ? (
            <input
              type="checkbox"
              checked={allPendingSelected}
              onChange={toggleSelectAllPending}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer accent-indigo-600"
              title="Chọn tất cả các đơn đang chờ duyệt"
            />
          ) : (
            <span className="text-slate-300 dark:text-slate-700 font-bold text-xs select-none" title="Không có đơn nào chờ duyệt">–</span>
          )}
        </div>
      ),
      sortable: false,
      width: '45px'
    },
    { key: 'id', label: 'Mã đơn', sortable: false, width: '90px' },
    { key: 'employee', label: 'Nhân viên', sortable: false },
    { key: 'workDate', label: 'Ngày làm việc', sortable: false, width: '135px' },
    { key: 'times', label: 'Khung giờ OT', sortable: false },
    { key: 'duration', label: 'Số giờ OT', sortable: false, width: '160px' },
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
            Kiểm duyệt đăng ký tăng ca
          </h1>
          <p className="text-xs text-slate-500">Phê duyệt hoặc từ chối các yêu cầu làm thêm giờ đăng ký từ nhân viên</p>
        </div>
        
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors disabled:opacity-60 bg-white dark:bg-slate-900"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filters Card */}
      <Card className="p-4 border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="workDate"
            type="date"
            value={dateFilter}
            onChange={handleFilterDate}
            placeholder="Lọc theo ngày tăng ca"
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
              <p className="text-sm font-semibold">Không tìm thấy yêu cầu tăng ca nào</p>
              <p className="text-xs text-slate-400">Chưa có nhân viên nào đăng ký tăng ca hoặc bộ lọc của bạn không trùng khớp</p>
            </Card>
          }
          renderRow={(req) => {
            const isPending = req.status === 'PENDING';
            const isChecked = selectedIds.includes(req.otRequestId);
            return (
              <>
                <td className="px-4 py-4 text-center">
                  {isPending ? (
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectRow(req.otRequestId)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer accent-indigo-600"
                      title="Chọn đơn này"
                    />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-700 font-bold text-xs select-none" title="Đơn này đã được xử lý">–</span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                  #{req.otRequestId}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{req.employeeFullName}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{req.employeeCode} ({req.departmentName || 'Không có phòng ban'})</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                  {dayjs(req.workDate).format('DD/MM/YYYY')}
                </td>
                <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                  {req.actualOtCheckOut ? (
                    <span>{dayjs(req.actualOtCheckIn).format('HH:mm')} ➜ {dayjs(req.actualOtCheckOut).format('HH:mm')}</span>
                  ) : (
                    <span className="text-slate-500 italic text-xs font-normal">Sau ca làm việc</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold font-mono">
                  {req.actualOtCheckOut ? (
                    <span>{(req.actualOtMinutes || 0) < 60 ? `${req.actualOtMinutes || 0} phút` : `${((req.actualOtMinutes || 0) / 60).toFixed(1)} giờ`}</span>
                  ) : (
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400">
                      Tính theo Check-out
                    </span>
                  )}
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
          ? `Kiểm tra & Duyệt hàng loạt (${selectedIds.length} đơn tăng ca)` 
          : `Kiểm tra & Từ chối hàng loạt (${selectedIds.length} đơn tăng ca)`}
        size="lg"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4 text-left">
          {/* List of Selected Requests with Details, Reasons & Remove button */}
          <div className="max-h-[320px] sm:max-h-[350px] overflow-y-auto space-y-3 pr-1">
            {selectedRequestsList.map((req) => (
              <div 
                key={req.otRequestId}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      #{req.otRequestId}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {req.employeeFullName || req.fullName || 'Nhân viên'}
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-mono">({req.employeeCode} - {req.departmentName || 'Chưa xếp phòng ban'})</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-100">
                      Tăng ca (OT)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newIds = selectedIds.filter(id => id !== req.otRequestId);
                        setSelectedIds(newIds);
                        if (newIds.length === 0) {
                          setIsBulkModalOpen(false);
                          toast.info('Đã hủy chọn tất cả các đơn');
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="Bỏ đơn này khỏi danh sách duyệt"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-650 dark:text-slate-350 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-slate-400">Ngày làm việc:</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {dayjs(req.workDate).format('DD/MM/YYYY')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Thời gian / Số giờ:</span>{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {req.actualOtCheckOut ? `${dayjs(req.actualOtCheckIn).format('HH:mm')} ➜ ${dayjs(req.actualOtCheckOut).format('HH:mm')}` : 'Tăng ca sau ca làm việc'}
                    </strong>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-400 block text-[10px] uppercase mb-0.5">Lý do tăng ca:</span>
                  <span className="italic">“{req.reason || 'Không có lý do chi tiết'}”</span>
                </div>
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
        title="Từ chối yêu cầu tăng ca"
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
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Từ chối đơn
            </button>
          </div>
        </form>
      </Modal>

      {/* OT Request Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRequest(null);
        }}
        title="Chi tiết đơn đăng ký tăng ca"
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hình thức:</span>
                <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Làm thêm giờ (Overtime)
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm text-left flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái duyệt:</span>
                <div className="w-fit">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>

            {/* Date & Time range Card */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm text-left flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian tăng ca:</span>
              
              <div className="grid grid-cols-3 gap-2 items-center text-center py-1">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-850 dark:text-slate-100">
                    {dayjs(selectedRequest.workDate).format('DD/MM/YYYY')}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Ngày làm việc</span>
                </div>
                
                <span className="text-slate-300 text-base font-light">➜</span>
                
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-850 dark:text-slate-100">
                    {selectedRequest.actualOtCheckOut ? 
                      `${dayjs(selectedRequest.actualOtCheckIn).format('HH:mm')} - ${dayjs(selectedRequest.actualOtCheckOut).format('HH:mm')}` : 
                      'Sau ca làm việc'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Khung giờ OT</span>
                </div>
              </div>
            </div>

            {/* Duration Card */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Số giờ OT:</span>
              <span className="text-sm font-bold text-[#4F46E5] dark:text-[#6366F1]">
                {selectedRequest.actualOtCheckOut ? 
                  ((selectedRequest.actualOtMinutes || 0) < 60 ? `${selectedRequest.actualOtMinutes || 0} phút` : `${((selectedRequest.actualOtMinutes || 0) / 60).toFixed(1)} giờ`) : 
                  'Tính theo Check-out thực tế'}
              </span>
            </div>

            {/* Reason Card */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lý do tăng ca:</span>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed font-medium shadow-sm">
                “{selectedRequest.reason || 'Không có lý do chi tiết'}”
              </div>
            </div>

            {/* Timeline history */}
            <div className="space-y-3 text-left pt-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Lịch sử xử lý</span>
              
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-4 ml-2 pt-1">
                {selectedRequest.status !== 'PENDING' && (
                  <div className="relative">
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

                <div className="relative">
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
            {selectedRequest.status === 'PENDING' && (role === 'ADMIN' || role === 'MANAGER' || role === 'SUPMANAGER') && (
              <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  onClick={() => handleApprove(selectedRequest.otRequestId)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer border border-transparent"
                >
                  <FiCheck className="w-4 h-4" />
                  Phê duyệt đơn
                </button>
                <button
                  onClick={() => openRejectModal(selectedRequest.otRequestId)}
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

export default OvertimeRequests;
