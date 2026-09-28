import apiClient from './client';

export const facultyApi = {
  registerFaculty: (data) => apiClient.post('/faculty/register', data),
  getMe: () => apiClient.get('/faculty/me'),
  getBorrowings: () => apiClient.get('/faculty/borrowings'),
  getFines: () => apiClient.get('/faculty/fines'),
};
