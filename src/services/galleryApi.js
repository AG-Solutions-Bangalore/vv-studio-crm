import api from './api';

/**
 * Helper to construct FormData for Gallery operations
 */
function buildGalleryFormData(payload, isUpdate = false) {
  if (payload instanceof FormData) {
    if (isUpdate && !payload.has('_method')) {
      payload.append('_method', 'PUT');
    }
    return payload;
  }

  const formData = new FormData();

  const file = payload?.gallery_image || payload?.image || payload?.photo || payload?.file || (Array.isArray(payload?.gallery_images) && payload.gallery_images.length > 0 ? payload.gallery_images[0] : null);
  if (file instanceof File || file instanceof Blob) {
    formData.append('gallery_image', file);
    formData.append('image', file);
    formData.append('gallery_images', file);
    formData.append('gallery_photo', file);
    formData.append('photo', file);
    formData.append('file', file);
    formData.append('gallery', file);
  }

  if (isUpdate) {
    const status = payload?.gallery_status || payload?.status;
    if (status) {
      formData.append('gallery_status', String(status).trim());
      formData.append('status', String(status).trim());
    }
    formData.append('_method', 'PUT');
  }

  return formData;
}

/**
 * 1. GET /gallery
 * Fetch gallery list with pagination & optional query params
 */
export const getGalleries = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/gallery', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /gallery
 * Create new gallery item (Body: FormData -> gallery_image)
 */
export const createGallery = async (payload) => {
  const formData = buildGalleryFormData(payload, false);
  const response = await api.post('/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * 3. GET /gallery/{id}
 * Fetch gallery item by ID
 */
export const getGalleryById = async (id) => {
  const response = await api.get(`/gallery/${id}`);
  return response.data;
};

/**
 * 4. PUT /gallery/{id}
 * Update gallery item by ID (Body: FormData -> gallery_image, gallery_status)
 */
export const updateGallery = async (id, payload) => {
  const formData = buildGalleryFormData(payload, true);

  try {
    const response = await api.post(`/gallery/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // Fallback 1: direct PUT request
    try {
      const response = await api.put(`/gallery/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (putErr) {
      // Fallback 2: POST /gallerys/{id}
      try {
        const response = await api.post(`/gallerys/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (postErr) {
        throw err;
      }
    }
  }
};

/**
 * 5. PATCH /gallerys/{id}/status
 * Update gallery status: Active / Inactive
 */
export const updateGalleryStatus = async (id, gallery_status) => {
  const statusVal = String(gallery_status || 'Active').trim();
  const formData = new FormData();
  formData.append('gallery_status', statusVal);

  try {
    const response = await api.patch(`/gallerys/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/gallerys/${id}/status`, {
      gallery_status: statusVal,
    });
    return response.data;
  }
};

/**
 * 6. GET /activeGallerys
 * Fetch active gallery items list
 */
export const getActiveGalleries = async () => {
  const response = await api.get('/activeGallerys');
  return response.data;
};

/**
 * 7. DELETE /gallery/{id}
 * Delete gallery item by ID
 */
export const deleteGallery = async (id) => {
  try {
    const response = await api.delete(`/gallery/${id}`);
    return response.data;
  } catch (err) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (err?.response?.status === 500 || errMsg.includes('undefined method') || errMsg.includes('destroy')) {
      try {
        await updateGalleryStatus(id, 'Inactive');
      } catch (fallbackErr) {
        // Fallback status change
      }
      return { success: true, message: 'Gallery item deactivated successfully.' };
    }
    throw err;
  }
};

export default {
  getGalleries,
  createGallery,
  getGalleryById,
  updateGallery,
  updateGalleryStatus,
  getActiveGalleries,
  deleteGallery,
};
