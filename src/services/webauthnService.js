import api from './api';

export const webauthnService = {
  getCredentials: async (params = {}) => {
    const res = await api.get('/api/admin/webauthn-credentials', { params });
    return res.data;
  },
  updateCredentialStatus: async (id, status) => {
    const res = await api.patch(`/api/admin/webauthn-credentials/${id}/status`, { status });
    return res.data;
  },
  revokeCredential: async (id) => {
    const res = await api.delete(`/api/admin/webauthn-credentials/${id}`);
    return res.data;
  },
};

export default webauthnService;
