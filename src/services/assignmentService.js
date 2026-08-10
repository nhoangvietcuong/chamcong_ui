import api from './api';

export const assignmentService = {
  getAssignments: async (params = {}) => {
    return api.get('/admin/assignments', { params });
  },
  
  getCalendar: async (params = {}) => {
    return api.get('/admin/assignments/calendar', { params });
  },
  
  getAssignmentById: async (id) => {
    return api.get(`/admin/assignments/${id}`);
  },
  
  createAssignment: async (data) => {
    return api.post('/admin/assignments', data);
  },
  
  updateAssignment: async (id, data) => {
    return api.put(`/admin/assignments/${id}`, data);
  },
  
  cancelAssignment(id, data) {
    return api.patch(`/admin/assignments/${id}/cancel`, data);
  },

  createBulkAssignments: async (data) => {
    return api.post('/admin/assignments/bulk', data);
  },

  copyAssignments: async (data) => {
    return api.post('/admin/assignments/copy', data);
  },

  bulkDeleteAssignments: async (data) => {
    return api.post('/admin/assignments/bulk-delete', data);
  },

  bulkUpdateLocation: async (data) => {
    return api.post('/admin/assignments/bulk-update-location', data);
  },

  bulkUpdateSelectedAssignments: async (data) => {
    return api.post('/admin/assignments/bulk-update-selected', data);
  },

  bulkDeleteSelectedAssignments: async (data) => {
    return api.post('/admin/assignments/bulk-delete-selected', data);
  }
};

export default assignmentService;
