import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { checkPanelStatus, getAssetBaseURL } from '../services/api';
import { encryptData, decryptData, encryptId, decryptId, secureStorage } from '../utils/crypto';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [appStatus, setAppStatus] = useState('loading'); // 'loading' | 'ok' | 'error'
  const [companyInfo, setCompanyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('emwa_crm_company');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [appVersion, setAppVersion] = useState(null);
  const [imageUrlConfig, setImageUrlConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('emwa_crm_image_url');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [dotenvConfig, setDotenvConfig] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('emwa_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('emwa_sidebar_collapsed', String(next));
      return next;
    });
  };

  const syncCompanyData = (company, version, imageUrls) => {
    if (company) {
      setCompanyInfo(company);
      localStorage.setItem('emwa_crm_company', JSON.stringify(company));
    }
    if (version) {
      setAppVersion(version);
    }
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      setImageUrlConfig(imageUrls);
      localStorage.setItem('emwa_crm_image_url', JSON.stringify(imageUrls));
    }
  };

  useEffect(() => {
    const handleCompanyUpdate = (e) => {
      if (e?.detail) {
        syncCompanyData(e.detail.company, e.detail.version, e.detail.imageUrls);
      }
    };
    window.addEventListener('emwa_company_updated', handleCompanyUpdate);

    (async () => {
      try {
        const data = await checkPanelStatus();
        const company = data?.company_detils || data?.company_details || null;
        const version = data?.version?.version_panel || null;
        const imageUrls = data?.image_url || [];

        syncCompanyData(company, version, imageUrls);
        setAppStatus('ok');

        console.info(
          `[AppContext] Backend OK — v${version} | Company: ${company?.company_name ?? 'N/A'}`,
        );
      } catch (err) {
        console.error('[AppContext] panel-check-status failed:', err.message);
        setAppStatus('error');
      }
    })();

    return () => {
      window.removeEventListener('emwa_company_updated', handleCompanyUpdate);
    };
  }, []);

  /** Helper to construct full company logo URL with dynamic API data and fallback */
  const companyLogoUrl = useMemo(() => {
    if (!companyInfo?.company_logo) return '/no_image.jpg';
    const companyImgObj = (imageUrlConfig || []).find(
      (i) => i.image_for?.toLowerCase() === 'company'
    );
    const fallbackBase = getAssetBaseURL('/assets/images/company_images/');
    const baseUrl = companyImgObj?.image_url || fallbackBase;
    if (
      companyInfo.company_logo.startsWith('http://') ||
      companyInfo.company_logo.startsWith('https://') ||
      companyInfo.company_logo.startsWith('blob:') ||
      companyInfo.company_logo.startsWith('data:')
    ) {
      return companyInfo.company_logo;
    }
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const cleanLogo = companyInfo.company_logo.startsWith('/')
      ? companyInfo.company_logo.slice(1)
      : companyInfo.company_logo;
    return `${cleanBase}${cleanLogo}`;
  }, [companyInfo, imageUrlConfig]);

  /** Helper for No Image default fallback URL */
  const noImageUrl = useMemo(() => {
    const noImgObj = (imageUrlConfig || []).find((i) => i.image_for?.toLowerCase() === 'no image');
    return noImgObj?.image_url || '/no_image.jpg';
  }, [imageUrlConfig]);

  /** Dynamically sync document title and browser tab favicon from backend company data */
  useEffect(() => {
    if (companyInfo?.company_name) {
      document.title = `${companyInfo.company_name} - Admin Portal`;
    } else {
      document.title = 'Admin Portal';
    }

    if (companyLogoUrl && companyLogoUrl !== '/no_image.jpg') {
      let faviconEl = document.querySelector("link[rel*='icon']");
      if (faviconEl) {
        faviconEl.href = companyLogoUrl;
      } else {
        faviconEl = document.createElement('link');
        faviconEl.rel = 'icon';
        faviconEl.href = companyLogoUrl;
        document.head.appendChild(faviconEl);
      }
    }
  }, [companyInfo, companyLogoUrl]);

  const value = useMemo(
    () => ({
      appStatus,
      companyInfo,
      setCompanyInfo: (info) => {
        setCompanyInfo(info);
        if (info) localStorage.setItem('emwa_crm_company', JSON.stringify(info));
      },
      companyDetails: companyInfo,
      appVersion,
      version: { version_panel: appVersion },
      imageUrlConfig,
      companyLogoUrl,
      noImageUrl,
      dotenvConfig,
      setDotenv: setDotenvConfig,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      toggleSidebar,
      crypto: {
        encryptId,
        decryptId,
        encrypt: encryptData,
        decrypt: decryptData,
        secureStorage,
      },
    }),
    [appStatus, companyInfo, appVersion, imageUrlConfig, companyLogoUrl, noImageUrl, dotenvConfig, isSidebarCollapsed],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};

export const useApp = useAppContext;

export default AppContext;
