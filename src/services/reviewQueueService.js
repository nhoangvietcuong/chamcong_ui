import api from './api';

const reviewQueueService = {
  getReviewQueue: (params = {}) =>
    api.get('/admin/attendance/review-queue', { params }),

  reviewAttendance: (attendanceId, data) =>
    api.patch(`/admin/attendance/${attendanceId}/review`, data),
};

export default reviewQueueService;
