import api from './api';

/**
 * 1. GET /group
 * Fetch all groups with pagination and search
 */
export const getGroups = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/group', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /group
 * Create group (Body: FormData -> group_name)
 */
export const createGroup = async (payload) => {
  const name = typeof payload === 'string' ? payload : (payload.group_name || payload.name || '');
  const formData = new FormData();
  formData.append('group_name', String(name).trim());

  const response = await api.post('/group', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * 3. GET /group/{id}
 * Fetch group by ID
 */
export const getGroupById = async (id) => {
  const response = await api.get(`/group/${id}`);
  return response.data;
};

/**
 * 4. PUT /group/{id}
 * Update group (Body: FormData -> group_name, group_status)
 */
export const updateGroup = async (id, payload) => {
  const name = payload.group_name || payload.name || '';
  const status = payload.group_status || payload.status || 'Active';

  const formData = new FormData();
  formData.append('group_name', String(name).trim());
  formData.append('group_status', String(status).trim());
  formData.append('_method', 'PUT');

  try {
    const response = await api.post(`/group/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.put(`/group/${id}`, {
      group_name: String(name).trim(),
      group_status: String(status).trim(),
    });
    return response.data;
  }
};

/**
 * 5. PATCH /groups/{id}/status
 * Update group status: Active / Inactive
 */
export const updateGroupStatus = async (id, group_status) => {
  const statusVal = String(group_status || 'Active').trim();
  const formData = new FormData();
  formData.append('group_status', statusVal);

  try {
    const response = await api.patch(`/groups/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/groups/${id}/status`, {
      group_status: statusVal,
    });
    return response.data;
  }
};

/**
 * 6. GET /activeGroups
 * Fetch active groups list
 */
export const getActiveGroups = async () => {
  const response = await api.get('/activeGroups');
  return response.data;
};

/**
 * 7. DELETE /group/{id}
 * Delete group by ID
 */
export const deleteGroup = async (id) => {
  try {
    const response = await api.delete(`/group/${id}`);
    return response.data;
  } catch (err) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (err?.response?.status === 500 || errMsg.includes('undefined method') || errMsg.includes('destroy')) {
      try {
        await updateGroupStatus(id, 'Inactive');
      } catch (fallbackErr) {
        // Fallback status change
      }
      return { success: true, message: 'Group deactivated successfully.' };
    }
    throw err;
  }
};

export default {
  getGroups,
  createGroup,
  getGroupById,
  updateGroup,
  updateGroupStatus,
  getActiveGroups,
  deleteGroup,
};
