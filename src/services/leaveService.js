import api from './api';

export const leaveService = {
  // Employee requests
  createRequest: (data) => api.post('/leave/requests', data),
  getMyRequests: (params) => api.get('/leave/my-requests', { params }),
  getMyLeaveBalance: (year) => api.get(`/leave/my-balance`, { params: { year } }),
  cancelRequest: (requestId) => api.delete(`/leave/requests/${requestId}`),

  // Manager requests
  getAdminRequests: (params) => api.get('/admin/leave/requests', { params }),
  approveOrReject: (requestId, status, approvalData = {}) => 
    api.patch(`/admin/leave/requests/${requestId}/status`, { status, ...approvalData }),
  bulkApprove: (leaveRequestIds) => api.patch('/admin/leave/requests/bulk-approve', { leaveRequestIds }),
  bulkReject: (leaveRequestIds, rejectReason) => api.patch('/admin/leave/requests/bulk-reject', { leaveRequestIds, rejectReason }),

  // Super Manager balance management
  getEmployeeLeaveBalance: (employeeId, year) => api.get(`/admin/leave/balances/${employeeId}`, { params: { year } }),
  updateTotalLeaveDays: (employeeId, year, annualDaysTotal) => api.put(`/admin/leave/balances/${employeeId}`, { year, annualDaysTotal })
};

export default leaveService;
