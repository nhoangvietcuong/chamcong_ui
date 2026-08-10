import api from './api';

export const accountService = {
  getAccounts: async (params = {}) => {
    return api.get('/admin/accounts', { params });
  }
};

export default accountService;
