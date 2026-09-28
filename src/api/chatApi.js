import apiClient from './client';

export const chatApi = {
  sendMessage: async ({ message, conversationHistory = [], currentRoute = '/' }) => {
    return apiClient.post('/chat', {
      message,
      conversationHistory,
      currentRoute,
    });
  },
};
