import apiClient from './client';

export const adminApi = {
  getLibrarians: () => apiClient.get('/admin/librarians'),
  createLibrarian: (data) => apiClient.post('/admin/librarians', data),
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (data) => apiClient.put('/settings', data),
  getAuditLogs: (params) => apiClient.get('/audit', { params }),
};
