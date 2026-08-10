import api from './api';

export const otService = {
  createRequest: (data) => api.post('/ot/requests', data),
  getMyRequests: (params) => api.get('/ot/my-requests', { params }),
  cancelRequest: (requestId) => api.delete(`/ot/requests/${requestId}`),

  // Manager requests
  getAdminRequests: (params) => api.get('/admin/ot/requests', { params }),
  approveRequest: (requestId) => api.patch(`/admin/ot/requests/${requestId}/approve`),
  rejectRequest: (requestId, rejectReason) => api.patch(`/admin/ot/requests/${requestId}/reject`, { rejectReason }),
  bulkApprove: (otRequestIds) => api.patch('/admin/ot/requests/bulk-approve', { otRequestIds }),
  bulkReject: (otRequestIds, rejectReason) => api.patch('/admin/ot/requests/bulk-reject', { otRequestIds, rejectReason })
};

export default otService;
