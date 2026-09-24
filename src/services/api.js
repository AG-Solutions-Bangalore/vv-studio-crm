import axios from 'axios';

const TOKEN_KEY = 'emwa_crm_token';

export const getBaseURL = () => {
  const envBaseURL =
    import.meta.env.VITE_API_BASE_URL;

  return envBaseURL.replace(/\/$/, '');
};

export const getAssetBaseURL = (subPath = '') => {
  const base = getBaseURL().replace(/\/api\/?$/, '');
  const cleanSubPath = subPath ? (subPath.startsWith('/') ? subPath : `/${subPath}`) : '';
  return `${base}${cleanSubPath}`;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const isPublicRoute =
        window.location.pathname === '/login' || window.location.pathname === '/forgot-password';
      if (!isPublicRoute) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('emwa_crm_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 1. panel-check-status
 * Public endpoint (no auth). Called at app startup.
 * Returns: { code, success, message, version: { version_panel }, company_detils: { ... }, image_url: [ ... ] }
 */
export const checkPanelStatus = async () => {
  const response = await api.get('/panel-check-status');
  return response.data;
};

/**
 * 2. panel-fetch-dotenv
 * GET /panel-fetch-dotenv
 * Returns: { data: "15963296e5d0827649d160c5576c7c2c" }
 */
export const fetchPanelDotenv = async () => {
  const response = await api.get('/panel-fetch-dotenv');
  return response?.data?.data || response?.data;
};

/**
 * 3. panel-login
 * POST /panel-login
 * Body: FormData (username, password)
 */
export const loginUser = async ({ username, password }) => {
  const formData = new FormData();
  formData.append('username', String(username || '').trim());
  formData.append('password', String(password || '').trim());

  try {
    const response = await api.post('/panel-login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const responseData = response?.data || {};
    const userInfo = responseData?.UserInfo || responseData?.userInfo || responseData?.data?.UserInfo || responseData?.data;

    const token =
      userInfo?.token ||
      responseData.token ||
      responseData.access_token ||
      responseData?.data?.token ||
      responseData?.data?.access_token;

    if (!token && responseData?.code !== 200 && responseData?.code !== 201 && responseData?.success !== 'ok') {
      throw new Error(responseData?.message || 'Invalid username or password. Please check your credentials and try again.');
    }

    return responseData;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Invalid username or password. Please check your credentials and try again.';

    throw new Error(message);
  }
};

/**
 * 4. panel-send-password (forgot password)
 * POST /panel-send-password
 * Body: FormData (username, email)
 */
export const sendPasswordResetEmail = async ({ username, email }) => {
  const formData = new FormData();
  formData.append('username', String(username || '').trim());
  formData.append('email', String(email || '').trim());

  try {
    const response = await api.post('/panel-send-password', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Unable to send password reset request. Please check your details and try again.';

    throw new Error(message);
  }
};

/**
 * 5. panel-change-password
 * POST /panel-change-password
 * Body: FormData (username, old_password, new_password)
 */
export const changeUserPassword = async ({ username, old_password, new_password }) => {
  const formData = new FormData();
  formData.append('username', String(username || '').trim());
  formData.append('old_password', String(old_password || '').trim());
  formData.append('new_password', String(new_password || '').trim());

  try {
    const response = await api.post('/panel-change-password', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Unable to change password. Please check your current password and try again.';

    throw new Error(message);
  }
};

/**
 * 6. panel-logout
 * POST /panel-logout
 * Authorization: Bearer <token>
 */
export const logoutUser = async () => {
  try {
    const response = await api.post('/panel-logout');
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Unable to logout. Please try again.';

    throw new Error(message);
  }
};

/**
 * 7. panel-fetch-profile
 * GET /panel-fetch-profile
 * Authorization: Bearer <token>
 */
export const fetchProfile = async () => {
  const response = await api.get('/panel-fetch-profile');
  return response.data;
};

/**
 * 8. panel-update-profile
 * PUT /panel-update-profile
 * Body: FormData (mobile, email)
 * Authorization: Bearer <token>
 */
export const updateProfile = async ({ mobile, email }) => {
  try {
    const formData = new FormData();
    formData.append('mobile', String(mobile || '').trim());
    formData.append('email', String(email || '').trim());
    formData.append('_method', 'PUT');

    const response = await api.post('/panel-update-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (jsonErr) {
    const response = await api.put('/panel-update-profile', {
      mobile: String(mobile || '').trim(),
      email: String(email || '').trim(),
    });

    return response.data;
  }
};

// Aliases for compatibility
export const getPanelStatus = checkPanelStatus;

export default api;
