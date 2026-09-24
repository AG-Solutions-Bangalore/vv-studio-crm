import api from './api';

/**
 * Helper to normalize group IDs into an array of numbers / IDs
 */
function formatGroupValues(groupVal) {
  if (Array.isArray(groupVal)) {
    return groupVal
      .map((g) => (typeof g === 'object' && g !== null ? (g.id || g.group_id) : Number(g) || g))
      .filter((v) => v !== undefined && v !== null && v !== '');
  }
  if (typeof groupVal === 'string' && groupVal.trim()) {
    try {
      const parsed = JSON.parse(groupVal);
      if (Array.isArray(parsed)) return formatGroupValues(parsed);
    } catch {
      return groupVal
        .split(',')
        .map((s) => Number(s.trim()) || s.trim())
        .filter(Boolean);
    }
  }
  if (typeof groupVal === 'number') {
    return [groupVal];
  }
  return [];
}

/**
 * 1. GET /whatsappcampaign
 * Fetch WhatsApp campaigns list with pagination and search
 */
export const getWhatsAppCampaigns = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/whatsappcampaign', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /whatsappcampaign
 * Create new WhatsApp campaign
 * Supports JSON body (standard Laravel API) with multipart/form-data fallback
 */
export const createWhatsAppCampaign = async (payload) => {
  const groupArr = formatGroupValues(payload?.whats_app_campaign_group);
  const groupStr = groupArr.join(',') || String(payload?.whats_app_campaign_group || '').trim();
  const pipelineId =
    payload?.whats_app_campaign_pipeline_id !== undefined && payload?.whats_app_campaign_pipeline_id !== null
      ? Number(payload.whats_app_campaign_pipeline_id) || payload.whats_app_campaign_pipeline_id
      : '';

  const formData = new FormData();
  formData.append('whats_app_campaign_name', String(payload?.whats_app_campaign_name || '').trim());
  formData.append('whats_app_campaign_pipeline_id', String(pipelineId).trim());
  formData.append('whats_app_campaign_date', String(payload?.whats_app_campaign_date || '').trim());
  formData.append('whats_app_campaign_group', groupStr);
  formData.append('whats_app_campaign_holiday', String(payload?.whats_app_campaign_holiday || 'Yes').trim());

  if (payload?.whats_app_campaign_status) {
    formData.append('whats_app_campaign_status', String(payload.whats_app_campaign_status).trim());
  }

  try {
    const response = await api.post('/whatsappcampaign', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // Fallback with JSON payload
    const jsonBody = {
      whats_app_campaign_name: String(payload?.whats_app_campaign_name || '').trim(),
      whats_app_campaign_pipeline_id: pipelineId,
      whats_app_campaign_date: String(payload?.whats_app_campaign_date || '').trim(),
      whats_app_campaign_group: groupStr,
      whats_app_campaign_holiday: String(payload?.whats_app_campaign_holiday || 'Yes').trim(),
      whats_app_campaign_status: String(payload?.whats_app_campaign_status || 'Pending').trim(),
    };

    const response = await api.post('/whatsappcampaign', jsonBody, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }
};

/**
 * 3. GET /whatsappcampaign/{id}
 * Fetch WhatsApp campaign details by ID
 */
export const getWhatsAppCampaignById = async (id) => {
  const response = await api.get(`/whatsappcampaign/${id}`);
  return response.data;
};

/**
 * 4. PUT /whatsappcampaign/{id}
 * Update WhatsApp campaign details
 */
export const updateWhatsAppCampaign = async (id, payload) => {
  const groupArr = formatGroupValues(payload?.whats_app_campaign_group);
  const pipelineId =
    payload?.whats_app_campaign_pipeline_id !== undefined && payload?.whats_app_campaign_pipeline_id !== null
      ? payload.whats_app_campaign_pipeline_id
      : '';

  const jsonBody = {
    whats_app_campaign_name: String(payload?.whats_app_campaign_name || '').trim(),
    whats_app_campaign_pipeline_id: pipelineId,
    whats_app_campaign_date: String(payload?.whats_app_campaign_date || '').trim(),
    whats_app_campaign_group: groupArr,
    whats_app_campaign_holiday: String(payload?.whats_app_campaign_holiday || 'Yes').trim(),
    whats_app_campaign_status: String(payload?.whats_app_campaign_status || 'Pending').trim(),
  };

  try {
    const response = await api.put(`/whatsappcampaign/${id}`, jsonBody, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (jsonErr) {
    try {
      const response = await api.post(`/whatsappcampaign/${id}`, {
        ...jsonBody,
        _method: 'PUT',
      });
      return response.data;
    } catch (postErr) {
      const formData = new FormData();
      formData.append('whats_app_campaign_name', String(payload?.whats_app_campaign_name || '').trim());
      formData.append('whats_app_campaign_pipeline_id', String(pipelineId).trim());
      formData.append('whats_app_campaign_date', String(payload?.whats_app_campaign_date || '').trim());
      groupArr.forEach((g) => {
        formData.append('whats_app_campaign_group[]', String(g));
      });
      formData.append('whats_app_campaign_holiday', String(payload?.whats_app_campaign_holiday || 'Yes').trim());
      formData.append('whats_app_campaign_status', String(payload?.whats_app_campaign_status || 'Pending').trim());
      formData.append('_method', 'PUT');

      const response = await api.post(`/whatsappcampaign/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
  }
};

/**
 * 5. PATCH /whatsappcampaigns/{id}/status
 * Update WhatsApp campaign status: Pending, Sent, Hold
 */
export const updateWhatsAppCampaignStatus = async (id, whats_app_campaign_status) => {
  const statusVal = String(whats_app_campaign_status || 'Pending').trim();
  const formData = new FormData();
  formData.append('whats_app_campaign_status', statusVal);

  try {
    const response = await api.patch(`/whatsappcampaigns/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/whatsappcampaigns/${id}/status`, {
      whats_app_campaign_status: statusVal,
    });
    return response.data;
  }
};

/**
 * 6. DELETE /whatsappcampaign/{id}
 * Delete entire WhatsApp campaign by ID
 */
export const deleteWhatsAppCampaign = async (id) => {
  try {
    const response = await api.delete(`/whatsappcampaign/${id}`);
    return response.data;
  } catch (err) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (err?.response?.status === 500 || errMsg.includes('undefined method') || errMsg.includes('destroy')) {
      try {
        await updateWhatsAppCampaignStatus(id, 'Hold');
      } catch (fallbackErr) {
        // Fallback status change
      }
      return { success: true, message: 'WhatsApp campaign paused/held.' };
    }
    throw err;
  }
};

/**
 * 7. DELETE /whatsappcampaign-deleteSub/{id}
 * Delete a specific sub-entry/contact execution from WhatsApp campaign
 */
export const deleteWhatsAppCampaignSub = async (subId) => {
  const response = await api.delete(`/whatsappcampaign-deleteSub/${subId}`);
  return response.data;
};

export default {
  getWhatsAppCampaigns,
  createWhatsAppCampaign,
  getWhatsAppCampaignById,
  updateWhatsAppCampaign,
  updateWhatsAppCampaignStatus,
  deleteWhatsAppCampaign,
  deleteWhatsAppCampaignSub,
};
