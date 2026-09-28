import apiClient from './client';

export const bookApi = {
  getNewArrivals: (params) => apiClient.get('/books/new-arrivals', { params }),
  searchBooks: (params) => apiClient.get('/books/search', { params }),
  getBookDetails: (bookId) => apiClient.get(`/books/details/${bookId}`),
  createBook: (data) => apiClient.post('/books', data),
  updateBook: (bookId, data) => apiClient.put(`/books/${bookId}`, data),
  retireBook: (bookId, reason) => apiClient.patch(`/books/${bookId}/retire`, { reason }),
  
  // Copies
  addBookCopy: (data) => apiClient.post('/books/copy', data),
  getBookCopyById: (copyId) => apiClient.get(`/books/copy/${copyId}`),
  updateBookCopy: (copyId, data) => apiClient.put(`/books/copy/${copyId}`, data),
  retireBookCopy: (copyId, reason) => apiClient.patch(`/books/copy/${copyId}/retire`, { reason }),
  
  // Inventory
  getLibrarianInventory: (params) => apiClient.get('/books/inventory/librarian', { params }),
  getAdminInventory: (params) => apiClient.get('/books/inventory/admin', { params }),
  importBooks: (dataset) => apiClient.post('/books/import', dataset || {}),
  
  // Filter Options & Categories
  getCategories: () => apiClient.get('/books/categories'),
  getFilterOptions: () => apiClient.get('/books/filter-options'),
};
