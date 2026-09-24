import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { fetchPanelDotenv, logoutUser } from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'emwa_crm_token';
const USER_KEY = 'emwa_crm_user';
const DOTENV_KEY = 'emwa_crm_dotenv';

function parseYesNo(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  const str = String(val).trim().toLowerCase();
  if (str === 'yes' || str === '1' || str === 'true') return 'Yes';
  if (str === 'no' || str === '0' || str === 'false') return 'No';
  return 'Yes';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [dotenvConfig, setDotenvConfig] = useState(() => {
    const saved = localStorage.getItem(DOTENV_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load dotenv config & log active permissions on startup
  useEffect(() => {
    (async () => {
      try {
        const envData = await fetchPanelDotenv();
        const dotenvHash = typeof envData === 'string' ? envData : (envData?.data || envData);
        if (dotenvHash) {
          localStorage.setItem(DOTENV_KEY, JSON.stringify(dotenvHash));
          setDotenvConfig(dotenvHash);
          console.info('[AuthContext] panel-fetch-dotenv loaded hash:', dotenvHash);
        }
      } catch (err) {
        console.warn('[AuthContext] panel-fetch-dotenv failed:', err.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      const emailStatus = user.isEmail !== undefined ? String(user.isEmail) : 'Yes';
      const whatsAppStatus = user.isWhatsApp !== undefined ? String(user.isWhatsApp) : 'Yes';
      console.info(
        `%c[EMWA CRM Session] %cisEmail: "${emailStatus}" | isWhatsApp: "${whatsAppStatus}"`,
        'background: #1A1817; color: #C99C4B; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
        'font-weight: bold;'
      );
    }
  }, [user]);

  /* ── LOGIN ── */
  const login = async (payload) => {
    const responseData = payload?.data || payload || {};
    const userInfo =
      responseData?.UserInfo ||
      responseData?.userInfo ||
      responseData?.data?.UserInfo ||
      responseData?.data ||
      responseData;

    const nextToken =
      userInfo?.token ||
      responseData.token ||
      responseData.access_token ||
      responseData?.data?.token ||
      responseData?.data?.access_token;

    if (!nextToken) {
      throw new Error('Invalid login response. No authentication token returned.');
    }

    const rawUser =
      userInfo?.user ||
      responseData.user ||
      responseData?.data?.user || {
        username:
          responseData.username ||
          responseData?.data?.username ||
          userInfo?.name ||
          userInfo?.username ||
          'Admin',
      };

    const nextUser = typeof rawUser === 'object' && rawUser !== null ? { ...rawUser } : { username: String(rawUser) };

    const findField = (keys) => {
      const candidates = [
        payload,
        payload?.data,
        payload?.data?.data,
        payload?.UserInfo,
        payload?.userInfo,
        payload?.user,
        payload?.company_detils,
        payload?.company_details,
        responseData,
        responseData?.data,
        responseData?.data?.data,
        responseData?.UserInfo,
        responseData?.userInfo,
        responseData?.user,
        responseData?.company_detils,
        responseData?.company_details,
        userInfo,
        nextUser,
      ];
      for (const obj of candidates) {
        if (!obj || typeof obj !== 'object') continue;
        for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null) {
            const parsed = parseYesNo(obj[k]);
            if (parsed !== null) return parsed;
          }
        }
      }
      return null;
    };

    const parsedEmailFlag = findField(['isEmail', 'is_email', 'isemail', 'isEmailAccess']);
    const parsedWhatsAppFlag = findField(['isWhatsApp', 'is_whatsapp', 'iswhatsapp', 'isWhatsAppAccess']);

    if (parsedEmailFlag !== null) {
      nextUser.isEmail = parsedEmailFlag;
    }
    if (parsedWhatsAppFlag !== null) {
      nextUser.isWhatsApp = parsedWhatsAppFlag;
    }

    // Console output for login permissions
    console.group('%c[EMWA CRM] Login Response & Permissions', 'color: #C99C4B; font-weight: bold; font-size: 13px;');
    console.log('Full Login Response Payload:', payload);
    console.log(`%cisEmail: %c"${nextUser.isEmail || 'Yes'}"`, 'font-weight: bold;', `color: ${nextUser.isEmail === 'Yes' ? 'green' : 'red'}; font-weight: bold;`);
    console.log(`%cisWhatsApp: %c"${nextUser.isWhatsApp || 'Yes'}"`, 'font-weight: bold;', `color: ${nextUser.isWhatsApp === 'Yes' ? 'green' : 'red'}; font-weight: bold;`);
    console.table({
      'isEmail': { Value: nextUser.isEmail || 'Yes', 'Allowed': (nextUser.isEmail || 'Yes').toLowerCase() === 'yes' },
      'isWhatsApp': { Value: nextUser.isWhatsApp || 'Yes', 'Allowed': (nextUser.isWhatsApp || 'Yes').toLowerCase() === 'yes' },
    });
    console.groupEnd();

    const tokenExpiresAt = userInfo?.token_expires_at || responseData?.token_expires_at || null;

    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    if (tokenExpiresAt) {
      localStorage.setItem('emwa_crm_token_expires_at', tokenExpiresAt);
    }

    setToken(nextToken);
    setUser(nextUser);

    const companyDetils = responseData?.company_detils || responseData?.company_details || payload?.company_detils || payload?.company_details || null;
    const imageUrls = responseData?.image_url || payload?.image_url || [];
    const versionPanel = responseData?.version?.version_panel || payload?.version?.version_panel || null;

    if (companyDetils) {
      localStorage.setItem('emwa_crm_company', JSON.stringify(companyDetils));
    }
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      localStorage.setItem('emwa_crm_image_url', JSON.stringify(imageUrls));
    }

    window.dispatchEvent(
      new CustomEvent('emwa_company_updated', {
        detail: {
          company: companyDetils,
          version: versionPanel,
          imageUrls: imageUrls,
        },
      })
    );

    // Fetch server-side dotenv config right after login
    try {
      const envData = await fetchPanelDotenv();
      const dotenvHash = typeof envData === 'string' ? envData : (envData?.data || envData);
      if (dotenvHash) {
        localStorage.setItem(DOTENV_KEY, JSON.stringify(dotenvHash));
        setDotenvConfig(dotenvHash);
        console.info('[AuthContext] panel-fetch-dotenv loaded hash:', dotenvHash);
      }
    } catch (err) {
      console.warn('[AuthContext] panel-fetch-dotenv failed (non-fatal):', err.message);
    }
  };

  /* ── LOGOUT ── */
  const logout = async () => {
    try {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      if (currentToken) {
        await logoutUser();
      }
    } catch (err) {
      console.warn('[AuthContext] Logout API call error:', err.message);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(DOTENV_KEY);
      localStorage.removeItem('emwa_crm_token_expires_at');
      setToken(null);
      setUser(null);
      setDotenvConfig(null);
    }
  };

  // Determine permissions based on user data
  const hasEmail = user?.isEmail !== undefined ? String(user.isEmail).trim().toLowerCase() === 'yes' : true;
  const hasWhatsApp = user?.isWhatsApp !== undefined ? String(user.isWhatsApp).trim().toLowerCase() === 'yes' : true;

  // Role-based permissions based on user_type (1: User, 2: Admin)
  const rawUserType = user?.user_type;
  const userType = rawUserType !== undefined && rawUserType !== null ? Number(rawUserType) : 2;
  const isAdmin = userType === 2;
  const isUser = userType === 1;
  const canDelete = isAdmin; // Standard user (user_type === 1) has no delete option anywhere

  const value = useMemo(
    () => ({
      token,
      user,
      userType,
      isAdmin,
      isUser,
      canDelete,
      isEmail: hasEmail ? 'Yes' : 'No',
      isWhatsApp: hasWhatsApp ? 'Yes' : 'No',
      hasEmail,
      hasWhatsApp,
      dotenvConfig,
      isAuthenticated: Boolean(token),
      login,
      logout,
      refreshDotenv: async () => {
        try {
          const envData = await fetchPanelDotenv();
          const dotenvHash = typeof envData === 'string' ? envData : (envData?.data || envData);
          if (dotenvHash) {
            localStorage.setItem(DOTENV_KEY, JSON.stringify(dotenvHash));
            setDotenvConfig(dotenvHash);
            return dotenvHash;
          }
        } catch (err) {
          console.warn('refreshDotenv error:', err);
        }
      },
    }),
    [token, user, userType, isAdmin, isUser, canDelete, dotenvConfig, hasEmail, hasWhatsApp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used inside AuthProvider');
  return context;
};

export default AuthContext;
