import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  appName: 'Coirendevouz',
  appVersion: packageJson.version,
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  googleMapApiKey: import.meta.env.VITE_MAP_API ?? '',
  /** Django REST API (`/api/v1`) — Faz 2+ entegrasyon */
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1',
};
