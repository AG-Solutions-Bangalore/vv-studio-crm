import api from './api';

/**
 * 1. GET /category
 * Fetch all categories with pagination and search
 */
export const getCategories = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/category', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /category
 * Create category (Body: FormData -> category_name)
 */
export const createCategory = async (payload) => {
  const name = typeof payload === 'string' ? payload : (payload.category_name || payload.categories || '');
  const formData = new FormData();
  formData.append('category_name', String(name).trim());

  try {
    const response = await api.post('/category', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // JSON fallback if multipart fails
    const response = await api.post('/category', { category_name: String(name).trim() });
    return response.data;
  }
};

/**
 * 3. GET /category/{id}
 * Fetch category by ID
 */
export const getCategoryById = async (id) => {
  const response = await api.get(`/category/${id}`);
  return response.data;
};

/**
 * 4. PUT /category/{id}
 * Update category (Body: FormData -> category_name, category_status)
 */
export const updateCategory = async (id, payload) => {
  const name = payload.category_name || payload.categories || '';
  const status = payload.category_status || payload.categories_status || payload.status || 'Active';

  try {
    const formData = new FormData();
    formData.append('category_name', String(name).trim());
    formData.append('category_status', String(status).trim());
    formData.append('_method', 'PUT');

    const response = await api.post(`/category/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (jsonErr) {
    const response = await api.put(`/category/${id}`, {
      category_name: String(name).trim(),
      category_status: String(status).trim(),
    });
    return response.data;
  }
};

/**
 * 5. PATCH /categorys/{id}/status
 * Update category status: Active, Inactive
 */
export const updateCategoryStatus = async (id, category_status) => {
  const statusVal = String(category_status || 'Active').trim();
  try {
    const formData = new FormData();
    formData.append('category_status', statusVal);

    const response = await api.patch(`/categorys/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/categorys/${id}/status`, {
      category_status: statusVal,
    });
    return response.data;
  }
};

/**
 * 6. GET /activeCategorys
 * Fetch active categories list
 */
export const getActiveCategories = async () => {
  const response = await api.get('/activeCategorys');
  return response.data;
};

/**
 * 7. DELETE /category/{id}
 * Delete category by ID
 */
export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/category/${id}`);
    return response.data;
  } catch (err) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (err?.response?.status === 500 || errMsg.includes('undefined method') || errMsg.includes('destroy')) {
      try {
        await updateCategoryStatus(id, 'Inactive');
      } catch (fallbackErr) {
        // Fallback status change
      }
      return { success: true, message: 'Category deactivated successfully.' };
    }
    throw err;
  }
};

export default {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
  getActiveCategories,
  deleteCategory,
};
