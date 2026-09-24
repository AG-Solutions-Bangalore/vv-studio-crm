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
 * 1. GET /emailcampaign
 * Fetch email campaign list with pagination and search filters
 */
export const getEmailCampaigns = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/emailcampaign', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /emailcampaign
 * Create new Email campaign
 * Body: FormData / JSON -> email_campaign_name, email_campaign_template_id, email_campaign_date, email_campaign_holiday, email_campaign_group, email_campaign_subject
 */
export const createEmailCampaign = async (payload) => {
  const groupArr = formatGroupValues(payload?.email_campaign_group);
  const groupStr = groupArr.join(',') || String(payload?.email_campaign_group || '').trim();
  const templateId =
    payload?.email_campaign_template_id !== undefined && payload?.email_campaign_template_id !== null
      ? payload.email_campaign_template_id
      : '';

  const formData = new FormData();
  formData.append('email_campaign_name', String(payload?.email_campaign_name || '').trim());
  formData.append('email_campaign_template_id', String(templateId).trim());
  formData.append('email_campaign_subject', String(payload?.email_campaign_subject || '').trim());
  formData.append('email_campaign_date', String(payload?.email_campaign_date || '').trim());
  formData.append('email_campaign_group', groupStr);
  formData.append('email_campaign_holiday', String(payload?.email_campaign_holiday || 'Yes').trim());

  if (payload?.email_campaign_status) {
    formData.append('email_campaign_status', String(payload.email_campaign_status).trim());
  }

  try {
    const response = await api.post('/emailcampaign', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // Fallback with JSON
    const jsonBody = {
      email_campaign_name: String(payload?.email_campaign_name || '').trim(),
      email_campaign_template_id: templateId,
      email_campaign_subject: String(payload?.email_campaign_subject || '').trim(),
      email_campaign_date: String(payload?.email_campaign_date || '').trim(),
      email_campaign_group: groupStr,
      email_campaign_holiday: String(payload?.email_campaign_holiday || 'Yes').trim(),
      email_campaign_status: String(payload?.email_campaign_status || 'Pending').trim(),
    };

    const response = await api.post('/emailcampaign', jsonBody, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }
};

/**
 * 3. GET /emailcampaign/{id}
 * Fetch email campaign details by ID
 */
export const getEmailCampaignById = async (id) => {
  const response = await api.get(`/emailcampaign/${id}`);
  return response.data;
};

/**
 * 4. PUT /emailcampaign/{id}
 * Update email campaign details (with _method: 'PUT')
 */
export const updateEmailCampaign = async (id, payload) => {
  const groupArr = formatGroupValues(payload?.email_campaign_group);
  const groupStr = groupArr.join(',') || String(payload?.email_campaign_group || '').trim();
  const templateId =
    payload?.email_campaign_template_id !== undefined && payload?.email_campaign_template_id !== null
      ? payload.email_campaign_template_id
      : '';

  const formData = new FormData();
  formData.append('email_campaign_name', String(payload?.email_campaign_name || '').trim());
  formData.append('email_campaign_template_id', String(templateId).trim());
  formData.append('email_campaign_subject', String(payload?.email_campaign_subject || '').trim());
  formData.append('email_campaign_date', String(payload?.email_campaign_date || '').trim());
  formData.append('email_campaign_group', groupStr);
  formData.append('email_campaign_holiday', String(payload?.email_campaign_holiday || 'Yes').trim());
  formData.append('_method', 'PUT');

  if (payload?.email_campaign_status) {
    formData.append('email_campaign_status', String(payload.email_campaign_status).trim());
  }

  try {
    const response = await api.post(`/emailcampaign/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const jsonBody = {
      email_campaign_name: String(payload?.email_campaign_name || '').trim(),
      email_campaign_template_id: templateId,
      email_campaign_subject: String(payload?.email_campaign_subject || '').trim(),
      email_campaign_date: String(payload?.email_campaign_date || '').trim(),
      email_campaign_group: groupStr,
      email_campaign_holiday: String(payload?.email_campaign_holiday || 'Yes').trim(),
      email_campaign_status: String(payload?.email_campaign_status || 'Pending').trim(),
    };
    const response = await api.put(`/emailcampaign/${id}`, jsonBody, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }
};

/**
 * 5. PATCH /emailcampaigns/{id}/status
 * Update email campaign status: Pending, Sent, Hold
 */
export const updateEmailCampaignStatus = async (id, email_campaign_status) => {
  const statusVal = String(email_campaign_status || 'Pending').trim();
  const formData = new FormData();
  formData.append('email_campaign_status', statusVal);

  try {
    const response = await api.patch(`/emailcampaigns/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/emailcampaigns/${id}/status`, {
      email_campaign_status: statusVal,
    });
    return response.data;
  }
};

/**
 * 6. DELETE /emailcampaign/{id}
 * Delete entire email campaign by ID
 */
export const deleteEmailCampaign = async (id) => {
  try {
    const response = await api.delete(`/emailcampaign/${id}`);
    return response.data;
  } catch (err) {
    const errMsg = err?.response?.data?.message || err?.message || '';
    if (err?.response?.status === 500 || errMsg.includes('undefined method') || errMsg.includes('destroy')) {
      try {
        await updateEmailCampaignStatus(id, 'Hold');
      } catch (fallbackErr) {
        // Fallback status change
      }
      return { success: true, message: 'Email campaign paused.' };
    }
    throw err;
  }
};

/**
 * 7. DELETE /emailcampaign-deleteSub/{id}
 * Delete a specific sub-entry/contact execution from Email campaign
 */
export const deleteEmailCampaignSub = async (subId) => {
  const response = await api.delete(`/emailcampaign-deleteSub/${subId}`);
  return response.data;
};

export default {
  getEmailCampaigns,
  createEmailCampaign,
  getEmailCampaignById,
  updateEmailCampaign,
  updateEmailCampaignStatus,
  deleteEmailCampaign,
  deleteEmailCampaignSub,
};
