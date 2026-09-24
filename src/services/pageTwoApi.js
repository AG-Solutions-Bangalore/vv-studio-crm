import { api } from './api';

/**
 * GET /pageTwo
 * Fetch list of static / CMS pages (e.g., Home, About Us, Blogs, Contact)
 * Returns: { data: [ { page_two_url: string, page_two_name: string } ] }
 */
export const getPageTwoList = async (params = {}) => {
  const response = await api.get('/pageTwo', { params });
  return response.data;
};

/**
 * GET /pageTwo/:url or :id
 * Fetch details for a specific page
 */
export const getPageTwoByUrl = async (pageUrl) => {
  const response = await api.get(`/pageTwo/${pageUrl}`);
  return response.data;
};

/**
 * PUT /pageTwo/:url or :id
 * Update page content / details
 */
export const updatePageTwo = async (pageUrl, data) => {
  if (data instanceof FormData) {
    data.append('_method', 'PUT');
    const response = await api.post(`/pageTwo/${pageUrl}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await api.put(`/pageTwo/${pageUrl}`, data);
  return response.data;
};

export default {
  getPageTwoList,
  getPageTwoByUrl,
  updatePageTwo,
};
