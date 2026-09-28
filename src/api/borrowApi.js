import apiClient from './client';

export const borrowApi = {
  issueBook: (data) => apiClient.post('/borrow/issue', data),
  returnBook: (data) => apiClient.post('/borrow/return', data),
  getOverdue: (params) => apiClient.get('/borrow/overdue', { params }),
  getHistory: (studentId) => apiClient.get(studentId ? `/borrow/history/${studentId}` : '/borrow/history'),
};
