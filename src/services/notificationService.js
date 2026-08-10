import api from './api';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const res = await api.get('/api/admin/notifications', { params });
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.post('/api/admin/notifications/read-all');
    return res.data;
  },
  clearAll: async () => {
    const res = await api.delete('/api/admin/notifications');
    return res.data;
  },
};

export default notificationService;
