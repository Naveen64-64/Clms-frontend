import apiClient from './client';

export const authApi = {
  login: (username, password) => apiClient.post('/auth/login', { username, email: username, password }),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh-token', { refreshToken }),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};
