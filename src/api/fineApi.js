import apiClient from './client';

export const fineApi = {
  getStudentFines: (rollNumber) => apiClient.get(`/fines/student/${rollNumber}`),
  payFine: (data) => apiClient.post('/fines/pay', data),
  getFineHistory: (params) => apiClient.get('/fines/history', { params }),
};
