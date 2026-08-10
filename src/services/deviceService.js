import api from './api';

export const deviceService = {
  getDevices: async (params = {}) => {
    const res = await api.get('/api/admin/registered-devices', { params });
    return res.data;
  },
  updateDeviceStatus: async (id, status) => {
    const res = await api.patch(`/api/admin/registered-devices/${id}/status`, { status });
    return res.data;
  },
  revokeDevice: async (id) => {
    const res = await api.delete(`/api/admin/registered-devices/${id}`);
    return res.data;
  },
};

export default deviceService;
