import api from './api';

const offlineReviewService = {
  /**
   * Lấy danh sách chấm công ngoại tuyến cần duyệt
   */
  getReviewList: (params = {}) =>
    api.get('/admin/offline-attendance', { params }),

  /**
   * Lấy chi tiết thông tin đối soát của bản ghi ngoại tuyến
   */
  getReviewDetail: (attendanceId) =>
    api.get(`/admin/offline-attendance/${attendanceId}`),

  /**
   * Phê duyệt chấm công ngoại tuyến
   */
  approveAttendance: (attendanceId, reviewNote) =>
    api.patch(`/admin/offline-attendance/${attendanceId}/approve`, { reviewNote }),

  /**
   * Từ chối chấm công ngoại tuyến
   */
  rejectAttendance: (attendanceId, reviewNote) =>
    api.patch(`/admin/offline-attendance/${attendanceId}/reject`, { reviewNote }),
};

export default offlineReviewService;
