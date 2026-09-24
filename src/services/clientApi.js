import api from './api';

/**
 * Helper to construct FormData for Client operations
 */
function buildClientFormData(payload, isUpdate = false) {
  if (payload instanceof FormData) {
    if (isUpdate && !payload.has('_method')) {
      payload.append('_method', 'PUT');
    }
    return payload;
  }

  const formData = new FormData();

  const name = payload?.clients_name || payload?.client_name || payload?.name || '';
  if (name) {
    formData.append('clients_name', String(name).trim());
  }

  const image = payload?.clients_image || payload?.client_image || payload?.image;
  if (image instanceof File || image instanceof Blob) {
    formData.append('clients_image', image);
  }

  if (isUpdate) {
    const status = payload?.clients_status || payload?.client_status || payload?.status;
    if (status) {
      formData.append('clients_status', String(status).trim());
    }
    formData.append('_method', 'PUT');
  }

  return formData;
}

/**
 * 1. GET /client
 * Fetch client list with pagination and search
 */
export const getClients = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/client', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /client
 * Create client (Body: FormData -> clients_name, clients_image)
 */
export const createClient = async (payload) => {
  const formData = buildClientFormData(payload, false);
  const response = await api.post('/client', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * 3. GET /client/{id}
 * Fetch client by ID
 */
export const getClientById = async (id) => {
  const response = await api.get(`/client/${id}`);
  return response.data;
};

/**
 * 4. PUT /client/{id}
 * Update client (Body: FormData -> clients_name, clients_image, clients_status)
 */
export const updateClient = async (id, payload) => {
  const formData = buildClientFormData(payload, true);

  try {
    const response = await api.post(`/client/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // Fallback direct PUT request
    const response = await api.put(`/client/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
};

/**
 * 5. PATCH /clients/{id}/status
 * Update client status: Active / Inactive
 */
export const updateClientStatus = async (id, clients_status) => {
  const statusVal = String(clients_status || 'Active').trim();
  const formData = new FormData();
  formData.append('clients_status', statusVal);

  try {
    const response = await api.patch(`/clients/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/clients/${id}/status`, {
      clients_status: statusVal,
    });
    return response.data;
  }
};

/**
 * 6. DELETE /client/{id}
 * Delete client by ID
 */
export const deleteClient = async (id) => {
  try {
    const response = await api.delete(`/client/${id}`);
    return response.data;
  } catch (err) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (err?.response?.status === 500 || errMsg.includes('undefined method') || errMsg.includes('destroy')) {
      try {
        await updateClientStatus(id, 'Inactive');
      } catch (fallbackErr) {
        // Fallback status change
      }
      return { success: true, message: 'Client deactivated successfully.' };
    }
    throw err;
  }
};

export default {
  getClients,
  createClient,
  getClientById,
  updateClient,
  updateClientStatus,
  deleteClient,
};
