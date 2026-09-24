import { api } from './api';

/**
 * GET /pageOne
 * Fetch list of pages for testimonials (e.g. page_url, page_name, etc.)
 */
export const getPageOneList = async (params = {}) => {
  const response = await api.get('/pageOne', { params });
  return response.data;
};

/**
 * GET /pageOne/:url or :id
 */
export const getPageOneByUrl = async (pageUrl) => {
  const response = await api.get(`/pageOne/${pageUrl}`);
  return response.data;
};

/**
 * PUT /pageOne/:url or :id
 */
export const updatePageOne = async (pageUrl, data) => {
  if (data instanceof FormData) {
    data.append('_method', 'PUT');
    const response = await api.post(`/pageOne/${pageUrl}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await api.put(`/pageOne/${pageUrl}`, data);
  return response.data;
};

export default {
  getPageOneList,
  getPageOneByUrl,
  updatePageOne,
};
