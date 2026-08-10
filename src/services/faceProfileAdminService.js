import api from './api';

export const faceProfileAdminService = {
  getFaceProfiles: async (params = {}) => {
    return api.get('/admin/face-profiles', { params });
  },

  updateStatus: async (profileId, status) => {
    return api.patch(`/admin/face-profiles/${profileId}/status`, { status });
  },

  deleteProfile: async (profileId) => {
    return api.delete(`/admin/face-profiles/${profileId}`);
  },

  getProfileByEmployeeId: async (employeeId) => {
    return api.get(`/admin/face-profiles/employee/${employeeId}`);
  },

  registerFaceAdmin: async (employeeId, formData) => {
    return api.post(`/admin/face-profiles/employee/${employeeId}/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateFaceAdmin: async (employeeId, formData) => {
    return api.put(`/admin/face-profiles/employee/${employeeId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteProfileByEmployeeId: async (employeeId) => {
    return api.delete(`/admin/face-profiles/employee/${employeeId}`);
  },

  registerFaceEmbeddingAdmin: async (employeeId, embeddings) => {
    return api.post(`/admin/face-profiles/employee/${employeeId}/register-embedding`, { embeddings });
  },

  updateFaceEmbeddingAdmin: async (employeeId, embeddings) => {
    return api.put(`/admin/face-profiles/employee/${employeeId}/update-embedding`, { embeddings });
  }
};

export default faceProfileAdminService;
