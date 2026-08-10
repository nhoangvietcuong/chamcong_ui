import api from './api';

export const webauthnAdminService = {
  getCredentials: async (params = {}) => {
    return api.get('/admin/webauthn-credentials', { params });
  },

  updateStatus: async (credentialId, status) => {
    return api.patch(`/admin/webauthn-credentials/${credentialId}/status`, { status });
  },

  deleteCredential: async (credentialId) => {
    return api.delete(`/admin/webauthn-credentials/${credentialId}`);
  }
};

export default webauthnAdminService;
