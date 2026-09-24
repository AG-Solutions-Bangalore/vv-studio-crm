import api from './api';

/**
 * 1. GET /newsletter
 * Fetch newsletter subscribers with query params (page, search, per_page)
 */
export const getNewsletters = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/newsletter', { params: queryParams });
  return response.data;
};

/**
 * 2. DELETE /newsletter/{id}
 * Delete a newsletter subscriber by ID
 */
export const deleteNewsletter = async (id) => {
  const response = await api.delete(`/newsletter/${id}`);
  return response.data;
};

export default {
  getNewsletters,
  deleteNewsletter,
};
