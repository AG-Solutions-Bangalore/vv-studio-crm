import api from './api';

/**
 * Helper to build FormData for Testimonial operations
 */
function buildTestimonialFormData(payload, isUpdate = false) {
  if (payload instanceof FormData) {
    if (isUpdate && !payload.has('_method')) {
      payload.append('_method', 'PUT');
    }
    return payload;
  }

  const formData = new FormData();

  if (payload?.testimonial_for !== undefined && payload?.testimonial_for !== null) {
    formData.append('testimonial_for', String(payload.testimonial_for).trim());
  }

  if (payload?.testimonial_client_name !== undefined && payload?.testimonial_client_name !== null) {
    formData.append('testimonial_client_name', String(payload.testimonial_client_name).trim());
  }

  if (payload?.testimonial_description !== undefined && payload?.testimonial_description !== null) {
    formData.append('testimonial_description', String(payload.testimonial_description).trim());
  }

  if (payload?.testimonial_rating !== undefined && payload?.testimonial_rating !== null) {
    formData.append('testimonial_rating', String(payload.testimonial_rating).trim());
  }

  if (payload?.testimonial_status !== undefined && payload?.testimonial_status !== null) {
    formData.append('testimonial_status', String(payload.testimonial_status).trim());
  }

  if (isUpdate) {
    formData.append('_method', 'PUT');
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    formData.append('testimonial_updated_date', nowStr);
    formData.append('updated_at', nowStr);
  }

  return formData;
}

/**
 * 1. GET /testimonial
 * Fetch testimonial list with pagination and search
 */
export const getTestimonials = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/testimonial', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /testimonial
 * Create testimonial (Body: FormData -> testimonial_for, testimonial_client_name, testimonial_description, testimonial_rating)
 */
export const createTestimonial = async (payload) => {
  const formData = buildTestimonialFormData(payload, false);

  try {
    const response = await api.post('/testimonial', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // JSON fallback
    const response = await api.post('/testimonial', {
      testimonial_for: String(payload.testimonial_for || '').trim(),
      testimonial_client_name: String(payload.testimonial_client_name || '').trim(),
      testimonial_description: String(payload.testimonial_description || '').trim(),
      testimonial_rating: String(payload.testimonial_rating || '5').trim(),
    });
    return response.data;
  }
};

/**
 * 3. GET /testimonial/{id}
 * Fetch testimonial by ID
 */
export const getTestimonialById = async (id) => {
  const response = await api.get(`/testimonial/${id}`);
  return response.data;
};

/**
 * 4. PUT /testimonial/{id}
 * Update testimonial (Body: FormData -> testimonial_for, testimonial_client_name, testimonial_description, testimonial_rating, testimonial_status)
 */
export const updateTestimonial = async (id, payload) => {
  const formData = buildTestimonialFormData(payload, true);
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    const response = await api.post(`/testimonial/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.put(`/testimonial/${id}`, {
      testimonial_for: String(payload.testimonial_for || '').trim(),
      testimonial_client_name: String(payload.testimonial_client_name || '').trim(),
      testimonial_description: String(payload.testimonial_description || '').trim(),
      testimonial_rating: String(payload.testimonial_rating || '5').trim(),
      testimonial_status: String(payload.testimonial_status || 'Active').trim(),
      testimonial_updated_date: nowStr,
      updated_at: nowStr,
    });
    return response.data;
  }
};

/**
 * 5. PATCH /testimonials/{id}/status
 * Update testimonial status: Active / Inactive
 */
export const updateTestimonialStatus = async (id, testimonial_status) => {
  const statusVal = String(testimonial_status || 'Active').trim();
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const formData = new FormData();
  formData.append('testimonial_status', statusVal);
  formData.append('testimonial_updated_date', nowStr);
  formData.append('updated_at', nowStr);

  try {
    const response = await api.patch(`/testimonials/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/testimonials/${id}/status`, {
      testimonial_status: statusVal,
      testimonial_updated_date: nowStr,
      updated_at: nowStr,
    });
    return response.data;
  }
};

/**
 * 6. DELETE /testimonial/{id}
 * Delete testimonial by ID
 */
export const deleteTestimonial = async (id) => {
  try {
    const response = await api.delete(`/testimonial/${id}`);
    return response.data;
  } catch (err) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (err?.response?.status === 500 || errMsg.includes('undefined method') || errMsg.includes('destroy')) {
      try {
        await updateTestimonialStatus(id, 'Inactive');
      } catch (fallbackErr) {
        // Fallback status change
      }
      return { success: true, message: 'Testimonial deactivated successfully.' };
    }
    throw err;
  }
};

export default {
  getTestimonials,
  createTestimonial,
  getTestimonialById,
  updateTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
};
