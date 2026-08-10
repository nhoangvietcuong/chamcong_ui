import api from './api';

export const employeeService = {
  getEmployees: async (params = {}) => {
    return api.get('/admin/employees', { params });
  },
  
  getEmployeeById: async (id) => {
    return api.get(`/admin/employees/${id}`);
  },
  
  getNextCode: async (roleNameOrId = '') => {
    const params = {};
    if (typeof roleNameOrId === 'number' || (!isNaN(Number(roleNameOrId)) && roleNameOrId !== '')) {
      params.roleId = roleNameOrId;
    } else if (roleNameOrId) {
      params.role = roleNameOrId;
    }
    return api.get('/admin/employees/next-code', { params });
  },
  
  createEmployee: async (data) => {
    return api.post('/admin/employees', data);
  },
  
  createEmployeeWithAccount: async (data) => {
    return api.post('/admin/employees/with-account', data);
  },
  
  updateEmployee: async (id, data) => {
    return api.put(`/admin/employees/${id}`, data);
  },
  
  bulkDeleteEmployees: async (employeeIds) => {
    return api.delete('/admin/employees/bulk-delete', { data: { ids: employeeIds } });
  },

  updateEmployeeStatus: async (id, status) => {
    return api.patch(`/admin/employees/${id}/status`, { status });
  },
  
  // Account related endpoints managed inside employees context
  createAccount: async (employeeId, data) => {
    return api.post(`/admin/employees/${employeeId}/account`, data);
  },
  
  updateAccountRole: async (accountId, roleId) => {
    return api.patch(`/admin/accounts/${accountId}/role`, { roleId });
  },
  
  updateAccountStatus: async (accountId, isActive) => {
    return api.patch(`/admin/accounts/${accountId}/status`, { isActive });
  },
  
  resetPassword: async (accountId, newPassword) => {
    return api.patch(`/admin/accounts/${accountId}/reset-password`, { newPassword });
  },
  
  updateUsername: async (accountId, newUsername) => {
    return api.patch(`/admin/accounts/${accountId}/username`, { newUsername });
  },

  
  getRoles: async () => {
    return api.get('/admin/roles');
  },
  
  getFaceProfile: async (employeeId) => {
    return api.get(`/admin/face-profiles/employee/${employeeId}`);
  },

  resetFaceProfile: async (employeeId) => {
    return api.delete(`/admin/face-profiles/${employeeId}`);
  },

  getEmployeeDevices: async (employeeId) => {
    return api.get(`/admin/employees/${employeeId}/devices`);
  },

  revokeEmployeeDevice: async (sessionId) => {
    return api.delete(`/admin/registered-devices/${sessionId}`);
  }
};

export default employeeService;
