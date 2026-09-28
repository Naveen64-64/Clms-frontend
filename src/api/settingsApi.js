import apiClient from './client';

export const settingsApi = {
  getSettings: () => apiClient.get('/settings'),
  getSystemSettings: () => apiClient.get('/settings'),
  updateSettings: (data) => apiClient.put('/settings', data),
  updateSystemSettings: (data) => apiClient.put('/settings', data),
};

export default settingsApi;
