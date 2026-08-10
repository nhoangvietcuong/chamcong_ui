import api from './api';

export const faceProfileService = {
  getFaceProfiles: async (params = {}) => {
    const res = await api.get('/api/admin/face-profiles', { params });
    return res.data;
  },
  getFaceProfileById: async (id) => {
    const res = await api.get(`/api/admin/face-profiles/${id}`);
    return res.data;
  },
  updateFaceProfileStatus: async (id, status) => {
    const res = await api.patch(`/api/admin/face-profiles/${id}/status`, { status });
    return res.data;
  },
  deleteFaceProfile: async (id) => {
    const res = await api.delete(`/api/admin/face-profiles/${id}`);
    return res.data;
  },
};

export default faceProfileService;
