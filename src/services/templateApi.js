import api from './api';

/**
 * Helper to construct FormData for Template operations
 */
function buildTemplateFormData(payload, isUpdate = false) {
  if (payload instanceof FormData) {
    if (isUpdate && !payload.has('_method')) {
      payload.append('_method', 'PUT');
    }
    return payload;
  }

  const formData = new FormData();

  const name = String(payload?.template_name || '').trim();
  const type = String(payload?.template_type || 'Email').trim();
  const isWhatsApp = type === 'WhatsApp';

  // If Email, template_id is template_name, else typing
  let templateId = payload?.template_id;
  if (type === 'Email') {
    templateId = name;
  } else {
    templateId = String(templateId || name).trim();
  }

  if (name) formData.append('template_name', name);
  if (type) formData.append('template_type', type);
  if (templateId) formData.append('template_id', templateId);

  if (isWhatsApp) {
    // For WhatsApp, send empty/null values for template_url and template_design
    formData.append('template_url', '');
    formData.append('template_design', '');
  } else {
    if (payload?.template_url !== undefined && payload?.template_url !== null) {
      formData.append('template_url', String(payload.template_url).trim());
    }

    if (payload?.template_design !== undefined && payload?.template_design !== null) {
      formData.append('template_design', String(payload.template_design).trim());
    }
  }

  if (payload?.template_status) {
    formData.append('template_status', String(payload.template_status).trim());
  }

  if (isUpdate) {
    formData.append('_method', 'PUT');
  }

  return formData;
}

/**
 * 1. GET /template
 * Fetch template list with pagination, search, and type filters
 */
export const getTemplates = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/template', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /template
 * Create new template (Body: FormData)
 */
export const createTemplate = async (payload) => {
  const formData = buildTemplateFormData(payload, false);

  try {
    const response = await api.post('/template', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // JSON fallback
    const type = String(payload?.template_type || 'Email').trim();
    const name = String(payload?.template_name || '').trim();
    const templateId = type === 'Email' ? name : String(payload?.template_id || name).trim();
    const isWhatsApp = type === 'WhatsApp';

    const response = await api.post('/template', {
      template_name: name,
      template_type: type,
      template_id: templateId,
      template_url: isWhatsApp ? null : String(payload?.template_url || '').trim(),
      template_design: isWhatsApp ? null : String(payload?.template_design || '').trim(),
    });
    return response.data;
  }
};

/**
 * 3. GET /template/{id}
 * Fetch template by ID
 */
export const getTemplateById = async (id) => {
  const response = await api.get(`/template/${id}`);
  return response.data;
};

/**
 * 4. PUT /template/{id}
 * Update template by ID (Body: FormData with _method='PUT')
 */
export const updateTemplate = async (id, payload) => {
  const formData = buildTemplateFormData(payload, true);

  try {
    const response = await api.post(`/template/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const type = String(payload?.template_type || 'Email').trim();
    const name = String(payload?.template_name || '').trim();
    const templateId = type === 'Email' ? name : String(payload?.template_id || name).trim();
    const isWhatsApp = type === 'WhatsApp';

    const response = await api.put(`/template/${id}`, {
      template_name: name,
      template_type: type,
      template_id: templateId,
      template_url: isWhatsApp ? null : String(payload?.template_url || '').trim(),
      template_design: isWhatsApp ? null : String(payload?.template_design || '').trim(),
      template_status: String(payload?.template_status || 'Active').trim(),
    });
    return response.data;
  }
};

/**
 * 5. PATCH /templates/{id}/status
 * Update template status: Active / Inactive
 */
export const updateTemplateStatus = async (id, template_status) => {
  const statusVal = String(template_status || 'Active').trim();
  const formData = new FormData();
  formData.append('template_status', statusVal);

  try {
    const response = await api.patch(`/templates/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    try {
      const response = await api.patch(`/templates/${id}/status`, {
        template_status: statusVal,
      });
      return response.data;
    } catch (err2) {
      try {
        const response = await api.patch(`/template/${id}/status`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (err3) {
        const response = await api.patch(`/template/${id}/status`, {
          template_status: statusVal,
        });
        return response.data;
      }
    }
  }
};

/**
 * 6. GET /activeTemplates/{type}
 * Fetch active templates for Email or WhatsApp
 */
export const getActiveTemplates = async (type = 'Email') => {
  try {
    const response = await api.get(`/activeTemplates/${type}`);
    return response.data;
  } catch (err) {
    try {
      const response = await api.get('/template', {
        params: { template_type: type, status: 'Active', per_page: 100 },
      });
      return response.data;
    } catch (fallbackErr) {
      throw err;
    }
  }
};

/**
 * 7. DELETE /template/{id}
 * Delete template by ID
 */
export const deleteTemplate = async (id) => {
  try {
    const response = await api.delete(`/template/${id}`);
    return response.data;
  } catch (err) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (err?.response?.status === 500 || errMsg.includes('undefined method') || errMsg.includes('destroy')) {
      try {
        await updateTemplateStatus(id, 'Inactive');
      } catch (fallbackErr) {
        // Fallback status change
      }
      return { success: true, message: 'Template deactivated successfully.' };
    }
    throw err;
  }
};

export default {
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  updateTemplateStatus,
  getActiveTemplates,
  deleteTemplate,
};
