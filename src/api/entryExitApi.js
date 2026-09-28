import apiClient from './client';

export const entryExitApi = {
  scanUserId: (userId, libraryId, action) =>
    apiClient.post('/entry-exit/gate', { userId, rollNumber: userId, userIdentifier: userId, libraryId, action }),
  scanRollNumber: (rollNumber, libraryId, action) =>
    apiClient.post('/entry-exit/gate', { rollNumber, userId: rollNumber, userIdentifier: rollNumber, libraryId, action }),
  toggleGate: (data) => apiClient.post('/entry-exit/gate', data),
  getActiveVisits: (libraryId) => {
    const cleanId = typeof libraryId === 'object' && libraryId !== null ? libraryId._id || libraryId.code : libraryId;
    if (cleanId) {
      return apiClient.get(`/entry-exit/active/${encodeURIComponent(cleanId)}`);
    }
    return apiClient.get('/entry-exit/active');
  },
  getRecentVisits: (libraryId) => apiClient.get(`/entry-exit/recent/${libraryId}`),
};

export const scanUserId = entryExitApi.scanUserId;
export const scanRollNumber = entryExitApi.scanRollNumber;
export const toggleGate = entryExitApi.toggleGate;
export const getActiveVisits = entryExitApi.getActiveVisits;
export const getRecentVisits = entryExitApi.getRecentVisits;

export default entryExitApi;
