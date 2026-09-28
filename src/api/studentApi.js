import apiClient from './client';

export const studentApi = {
  registerStudent: (data) => apiClient.post('/students/register', data),
  getStudents: (params) => apiClient.get('/students', { params }),
  getProfile: (rollNumber) => apiClient.get(rollNumber ? `/students/profile/${rollNumber}` : '/students/profile'),
  updateProfile: (rollNumber, data) => apiClient.put(rollNumber ? `/students/profile/${rollNumber}` : '/students/profile', data),
  getTcClearance: (rollNumber) => apiClient.get(`/students/tc-clearance/${rollNumber}`),
  clearStudentData: (rollNumber, confirmationRollNumber) =>
    apiClient.post(`/students/tc-clearance/${rollNumber}/clear`, { confirmationRollNumber }),
  getStudentDetails: (rollNumber) => apiClient.get(`/students/${rollNumber}/details`),
  bulkImport: (students) => apiClient.post('/students/import', { students }),
  bulkImportFile: (formData) =>
    apiClient.post('/students/import-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
