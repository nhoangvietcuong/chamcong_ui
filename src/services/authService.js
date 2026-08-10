import api, { getDeviceName } from './api';

export const authService = {
  login: async (username, password) => {
    const deviceName = getDeviceName();
    return api.post('/auth/login', { username, password, deviceName });
  },
  
  logout: async () => {
    return api.post('/auth/logout');
  },
  
  me: async () => {
    return api.get('/auth/me');
  }
};

export default authService;
