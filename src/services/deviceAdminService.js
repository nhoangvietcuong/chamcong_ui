import api from './api';

export const deviceAdminService = {
  getDevices: async (params = {}) => {
    return api.get('/admin/registered-devices', { params });
  },

  updateStatus: async (sessionId, status) => {
    return api.patch(`/admin/registered-devices/${sessionId}/status`, { status });
  },

  revokeDevice: async (sessionId) => {
    return api.delete(`/admin/registered-devices/${sessionId}`);
  }
};

export default deviceAdminService;
