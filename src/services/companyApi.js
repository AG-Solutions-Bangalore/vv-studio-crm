import api, { checkPanelStatus } from './api';

/**
 * 1. GET /company or /panel-check-status
 * Fetch complete company branding and organization details
 */
export const getCompanyDetails = async () => {
  try {
    const res = await api.get('/company');
    if (res?.data?.company_detils || res?.data?.company_details || res?.data?.data) {
      return res.data;
    }
    if (res?.data && typeof res.data === 'object' && res.data.company_name) {
      return { success: true, company_details: res.data };
    }
  } catch (err) {
    // Fallback to checkPanelStatus
  }

  const statusData = await checkPanelStatus();
  return statusData;
};

/**
 * 2. POST/PUT /company or /company-details
 * Update company information (FormData supported for logo uploads)
 */
export const updateCompanyDetails = async (payload) => {
  let body = payload;

  if (payload instanceof FormData) {
    body = payload;
    if (!body.has('_method')) {
      body.append('_method', 'PUT');
    }
  } else {
    const formData = new FormData();
    Object.entries(payload || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        if (v instanceof File || v instanceof Blob) {
          formData.append(k, v);
        } else {
          formData.append(k, String(v).trim());
        }
      }
    });
    formData.append('_method', 'PUT');
    body = formData;
  }

  try {
    const response = await api.post('/company', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    try {
      const response = await api.post('/panel-update-company', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (fallbackErr) {
      const response = await api.put('/company', payload);
      return response.data;
    }
  }
};

export default {
  getCompanyDetails,
  updateCompanyDetails,
};
