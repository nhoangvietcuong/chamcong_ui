import api from './api';

export const departmentService = {
  getDepartments: async (params = {}) => {
    return api.get('/admin/departments', { params });
  },
  
  getDepartmentById: async (id) => {
    return api.get(`/admin/departments/${id}`);
  },
  
  createDepartment: async (data) => {
    return api.post('/admin/departments', data);
  },
  
  updateDepartment: async (id, data) => {
    return api.put(`/admin/departments/${id}`, data);
  },
  
  updateDepartmentStatus: async (id, status) => {
    return api.patch(`/admin/departments/${id}/status`, { status });
  }
};

export default departmentService;
