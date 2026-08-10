import api from './api';

export const workLocationService = {
  getWorkLocations: async (params = {}) => {
    return api.get('/admin/work-locations', { params });
  },
  
  getWorkLocationById: async (id) => {
    return api.get(`/admin/work-locations/${id}`);
  },
  
  createWorkLocation: async (data) => {
    return api.post('/admin/work-locations', data);
  },
  
  updateWorkLocation: async (id, data) => {
    return api.put(`/admin/work-locations/${id}`, data);
  },
  
  updateWorkLocationStatus: async (id, status) => {
    return api.patch(`/admin/work-locations/${id}/status`, { status });
  },

  bulkDeleteWorkLocations: async (ids) => {
    return api.post('/admin/work-locations/bulk-delete', { ids });
  }
};

export default workLocationService;
