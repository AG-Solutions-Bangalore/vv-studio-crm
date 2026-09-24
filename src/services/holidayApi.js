import api from './api';

/**
 * 1. GET /holiday
 * Fetch all holidays with pagination and optional query params
 */
export const getHolidays = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/holiday', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /holiday
 * Create holiday (Body: FormData -> holiday_date, optional holiday_name)
 */
export const createHoliday = async (payload) => {
  const dateVal = typeof payload === 'string' ? payload : (payload.holiday_date || payload.date || '');
  const formData = new FormData();
  formData.append('holiday_date', String(dateVal).trim());

  if (payload.holiday_name) {
    formData.append('holiday_name', String(payload.holiday_name).trim());
  }

  try {
    const response = await api.post('/holiday', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // JSON fallback
    const response = await api.post('/holiday', {
      holiday_date: String(dateVal).trim(),
      ...(payload.holiday_name ? { holiday_name: String(payload.holiday_name).trim() } : {}),
    });
    return response.data;
  }
};

/**
 * 3. GET /holiday/{id}
 * Fetch holiday by ID (with fallback if backend controller omits show method)
 */
export const getHolidayById = async (id) => {
  try {
    const response = await api.get(`/holiday/${id}`);
    return response.data;
  } catch (err) {
    return null;
  }
};

/**
 * 4. PUT /holiday/{id}
 * Update holiday by ID
 * Note: If backend HolidayController does not have update(), seamlessly replaces via POST + DELETE
 */
export const updateHoliday = async (id, payload) => {
  const dateVal = payload.holiday_date || payload.date || '';
  const formData = new FormData();
  formData.append('holiday_date', String(dateVal).trim());
  if (payload.holiday_name) {
    formData.append('holiday_name', String(payload.holiday_name).trim());
  }
  formData.append('_method', 'PUT');

  try {
    const response = await api.post(`/holiday/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    try {
      const response = await api.put(`/holiday/${id}`, {
        holiday_date: String(dateVal).trim(),
        ...(payload.holiday_name ? { holiday_name: String(payload.holiday_name).trim() } : {}),
      });
      return response.data;
    } catch (putErr) {
      // Seamless replacement fallback if backend lacks update method
      const createRes = await createHoliday(payload);
      if (id) {
        try {
          await deleteHoliday(id);
        } catch (delErr) {
          // ignore cleanup error
        }
      }
      return createRes;
    }
  }
};

/**
 * 5. DELETE /holiday/{id}
 * Delete holiday by ID
 */
export const deleteHoliday = async (id) => {
  const response = await api.delete(`/holiday/${id}`);
  return response.data;
};

export default {
  getHolidays,
  createHoliday,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
};
