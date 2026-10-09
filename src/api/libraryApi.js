import apiClient from './client';

export const libraryApi = {
  getAllLibraries: () => apiClient.get('/libraries'),
  getLibraries: () => apiClient.get('/libraries'),
  getAll: () => apiClient.get('/libraries'),
  getLibraryStatus: (libraryId) => apiClient.get(libraryId ? `/libraries/${libraryId}/status` : '/libraries/status'),
  // getSeatStatus: alias used by LibraryEntrancePage — must match getLibraryStatus
  getSeatStatus: (libraryId) => apiClient.get(libraryId ? `/libraries/${libraryId}/status` : '/libraries/status'),
  createLibrary: (data) => apiClient.post('/libraries', data),
  updateLibrary: (libraryId, data) => apiClient.put(`/libraries/${libraryId}`, data),
};
