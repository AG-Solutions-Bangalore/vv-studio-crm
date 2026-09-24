import api from './api';

/**
 * 1. GET /getEnquiryReport
 * Fetch enquiry report data or export
 * @param {Object} params - Query parameters (e.g. status, start_date, end_date, search)
 */
export const getEnquiryReport = async (params = {}) => {
  try {
    const response = await api.get('/getEnquiryReport', { params });
    return response.data;
  } catch (err) {
    // If endpoint has kebab-case fallback
    if (err?.response?.status === 404) {
      const fallbackResponse = await api.get('/enquiry-report', { params });
      return fallbackResponse.data;
    }
    throw err;
  }
};

/**
 * 2. Helper to fetch raw blob / export if the endpoint streams a file directly
 */
export const fetchEnquiryReportBlob = async (params = {}) => {
  const response = await api.get('/getEnquiryReport', {
    params,
    responseType: 'blob',
  });
  return response;
};

export default {
  getEnquiryReport,
  fetchEnquiryReportBlob,
};
