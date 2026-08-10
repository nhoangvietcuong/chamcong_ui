import api from './api';

export const dashboardService = {
  getStats: async () => {
    return api.get('/admin/dashboard/stats');
  },
  getCharts: async () => {
    return api.get('/admin/dashboard/charts');
  },
  getSystemLogs: async () => {
    return api.get('/admin/system-logs');
  },
  getSecurityMetrics: async () => {
    return api.get('/admin/security/metrics');
  },
  getAuditLogs: async (params = {}) => {
    return api.get('/admin/audit-logs', { params });
  },
  getSettings: async () => {
    return api.get('/admin/settings');
  },
  updateSettings: async (data) => {
    return api.put('/admin/settings', data);
  }
};

export default dashboardService;
