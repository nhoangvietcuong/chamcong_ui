import api from './api';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const res = await api.get('/admin/notifications', { params });
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.post('/admin/notifications/read-all');
    return res.data;
  },
  clearAll: async () => {
    const res = await api.delete('/admin/notifications');
    return res.data;
  },
  getVapidKey: async () => {
    const res = await api.get('/notification/vapid-key');
    return res.data;
  },
  subscribeToPushNotification: async (subscriptionData) => {
    const res = await api.post('/notification/subscribe', subscriptionData);
    return res.data;
  },
};

export default notificationService;
