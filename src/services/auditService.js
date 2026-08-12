import api from './api';

export const auditService = {
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
  getAuditLogById: async (id) => {
    const res = await api.get(`/admin/audit-logs/${id}`);
    return res.data;
  },
};

export default auditService;
