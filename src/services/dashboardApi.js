import api from './api';

/**
 * 1. GET /dashboard
 * Fetch dashboard overview statistics, counts, and recent metrics
 * Authorization: Bearer Token
 */
export const getDashboardData = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export default {
  getDashboardData,
};
