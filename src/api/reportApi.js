import apiClient from './client';

export const reportApi = {
  getDashboard: (params) => apiClient.get('/reports/dashboard', { params }),
  getLibraryComparison: (params) => apiClient.get('/reports/library-comparison', { params }),
  getBookAnalytics: (params) => apiClient.get('/reports/books', { params }),
  getMostBorrowed: (params) => apiClient.get('/reports/most-borrowed', { params }),
  getBorrowingTrends: (params) => apiClient.get('/reports/borrowing-trends', { params }),
  getReturnsAnalytics: (params) => apiClient.get('/reports/returns', { params }),
  getOverdueAnalytics: (params) => apiClient.get('/reports/overdue', { params }),
  getVisitorAnalytics: (params) => apiClient.get('/reports/visitors', { params }),
  getSeatUtilization: (params) => apiClient.get('/reports/seat-utilization', { params }),
  getFinancialAnalytics: (params) => apiClient.get('/reports/financial', { params }),
  getStudentActivity: (params) => apiClient.get('/reports/student-activity', { params }),
};
