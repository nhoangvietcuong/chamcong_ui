import api from './api';

export const deviceBiometricService = {
  getCredentials: async (employeeId) => {
    return api.get(`/v1/device-biometric/credentials`, {
      params: { employeeId }
    });
  },
  
  deleteCredential: async (credentialId, employeeId) => {
    return api.delete(`/v1/device-biometric/credentials/${credentialId}`, {
      params: { employeeId }
    });
  }
};

export default deviceBiometricService;
