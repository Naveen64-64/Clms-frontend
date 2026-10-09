import apiClient from './client';

export const tcClearanceApi = {
  submitRequest: (data) => apiClient.post('/tc-clearance/request', data),
  getMyRequest: () => apiClient.get('/tc-clearance/my-request'),
  getRequestsQueue: (params) => apiClient.get('/tc-clearance/requests', { params }),
  getRequestDetails: (id) => apiClient.get(`/tc-clearance/requests/${id}`),
  approveRequest: (id) => apiClient.patch(`/tc-clearance/requests/${id}/approve`),
  rejectRequest: (id, rejectionReason) => apiClient.patch(`/tc-clearance/requests/${id}/reject`, { rejectionReason }),
};
