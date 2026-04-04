import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { messageFromResponseData } from './api-errors';
import {
  getAccessToken,
  getRefreshToken,
  clearStoredTokens,
  setStoredAccessToken,
  setStoredRefreshToken,
} from './auth-session';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Refresh isteğinde sonsuz döngüyü engeller. */
function isAuthRefreshRequest(config: AxiosRequestConfig): boolean {
  const url = config.url ?? '';
  return url.includes('auth/token/refresh/');
}

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('Oturum süresi doldu; lütfen yeniden giriş yapın.');
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string; refresh?: string }>(
        `${CONFIG.serverUrl.replace(/\/$/, '')}/auth/token/refresh/`,
        { refresh },
        { headers: { 'Content-Type': 'application/json' } }
      )
      .then((res) => {
        const { access, refresh: newRefresh } = res.data;
        if (!access) {
          throw new Error('Yeni access token alınamadı.');
        }
        setStoredAccessToken(access);
        if (newRefresh) {
          setStoredRefreshToken(newRefresh);
        }
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${access}`;
        return access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const data = error.response?.data;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRefreshRequest(originalRequest) &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axiosInstance(originalRequest);
      } catch {
        clearStoredTokens();
        delete axiosInstance.defaults.headers.common.Authorization;
        const msg = messageFromResponseData(data) || 'Oturum süresi doldu; lütfen yeniden giriş yapın.';
        return Promise.reject(new Error(msg));
      }
    }

    const msg = messageFromResponseData(data) || error.message || 'Bir hata oluştu.';
    console.error('Axios error:', msg);
    return Promise.reject(new Error(msg));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    const res = await axiosInstance.get<T>(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: 'users/me/',
    signIn: 'auth/token/',
    signUp: 'auth/register/',
    refresh: 'auth/token/refresh/',
  },
  business: {
    mine: 'businesses/mine/',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
} as const;

export { getApiErrorMessage } from './api-errors';
