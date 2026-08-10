import api from './api';

export const attendanceService = {
  getAdminAttendance: async (params = {}) => {
    return api.get('/admin/attendance', { params });
  },
  getEmployeePhotos: async (employeeId, params = {}) => {
    return api.get(`/admin/employees/${employeeId}/photos`, { params });
  },
};

export default attendanceService;
