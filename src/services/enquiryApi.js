import api from './api';

/**
 * 1. GET /enquiry
 * Fetch enquiries with query params (page, search, status, per_page)
 */
export const getEnquiries = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/enquiry', { params: queryParams });
  return response.data;
};

/**
 * 2. GET /enquiry/{id}
 * Fetch enquiry by ID
 */
export const getEnquiryById = async (id) => {
  const response = await api.get(`/enquiry/${id}`);
  return response.data;
};

/**
 * 3. PUT /enquiry/{id}
 * Update enquiry status: Pending, Cancel, Completed, Processing
 */
export const updateEnquiryStatus = async (id, enquiryStatus) => {
  try {
    const formData = new FormData();
    formData.append('enquiryStatus', String(enquiryStatus || '').trim());
    formData.append('_method', 'PUT');

    const response = await api.post(`/enquiry/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (jsonErr) {
    const response = await api.put(`/enquiry/${id}`, {
      enquiryStatus: String(enquiryStatus || '').trim(),
    });
    return response.data;
  }
};

/**
 * 4. DELETE /enquiry/{id}
 * Delete an enquiry by ID
 */
export const deleteEnquiry = async (id) => {
  const response = await api.delete(`/enquiry/${id}`);
  return response.data;
};

/**
 * 5. GET /getEnquiryReport
 * Fetch enquiry report for export or analysis
 */
export const getEnquiryReport = async (params = {}) => {
  const response = await api.get('/getEnquiryReport', { params });
  return response.data;
};

export default {
  getEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  deleteEnquiry,
  getEnquiryReport,
};
