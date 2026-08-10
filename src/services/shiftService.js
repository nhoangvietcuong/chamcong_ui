import api from './api';

export const shiftService = {
  getShifts: async (params = {}) => {
    return api.get('/admin/work-shifts', { params });
  }
};

export default shiftService;
