import apiClient from './client';

export const userApi = {
  getUsers: (params) => apiClient.get('/users', { params }),
  getUserDetails: (identifier, params) => apiClient.get(`/users/details/${identifier}`, { params }),
};
