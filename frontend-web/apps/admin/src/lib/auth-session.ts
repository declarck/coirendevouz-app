import {
  JWT_STORAGE_KEY,
  JWT_REFRESH_STORAGE_KEY,
} from 'src/auth/context/jwt/constant';

/**
 * Axios döngüsel import kullanmadan token okuma/yazma (interceptors için).
 */

export function getAccessToken(): string | null {
  return sessionStorage.getItem(JWT_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);
}

export function clearStoredTokens(): void {
  sessionStorage.removeItem(JWT_STORAGE_KEY);
  sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
}

export function setStoredRefreshToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(JWT_REFRESH_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
  }
}

export function setStoredAccessToken(token: string): void {
  sessionStorage.setItem(JWT_STORAGE_KEY, token);
}
