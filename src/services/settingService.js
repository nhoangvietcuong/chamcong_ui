import api from './api';

export const settingService = {
  getSettings: async () => {
    const res = await api.get('/api/admin/settings');
    return res.data;
  },
  updateSettings: async (data) => {
    const res = await api.put('/api/admin/settings', data);
    return res.data;
  },
};

export default settingService;
