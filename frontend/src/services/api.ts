import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

/** Raíz del backend vista desde el navegador (sin /api final). */
const backendRoot = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** URL absoluta al backend para un path tipo `/documentos/1/download`. */
export function backendUrl(path: string): string {
  if (!backendRoot) return `/api${path}`;
  return `${backendRoot}${path}`;
}

/** Convierte URLs guardadas con prefijo `/api/...` a absolutas del backend. */
export function resolvePublicUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('/api/')) return backendUrl(url.slice(4));
  return url;
}

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const RUTAS_PUBLICAS_AUTH = ['/auth/inicio-sesion', '/auth/registro'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const esAuthPublica = RUTAS_PUBLICAS_AUTH.some((ruta) => url.includes(ruta));
    if (error.response?.status === 401 && !esAuthPublica && window.location.pathname !== '/inicio-sesion') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/inicio-sesion';
    }
    return Promise.reject(error);
  },
);

export default api;
