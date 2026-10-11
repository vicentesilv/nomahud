import axios from 'axios';
import { Capacitor } from '@capacitor/core';

/** URL pública de la API (producción/Railway). Se usa solo como fallback en la app nativa. */
const API_PUBLICA_FALLBACK = 'https://nomahudapi.up.railway.app';

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (Capacitor.isNativePlatform() ? API_PUBLICA_FALLBACK : '/api');

/** Raíz del backend vista desde el navegador (sin /api final). */
const backendRoot = (
  import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? API_PUBLICA_FALLBACK : '')
).replace(/\/$/, '');

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

/** Extrae el array de una respuesta paginada `{datos,...}` o directa `[]`. */
export function extraerLista<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { datos?: unknown }).datos)) {
    return (data as { datos: T[] }).datos;
  }
  return [];
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

const RUTAS_SIN_REFRESH = ['/auth/inicio-sesion', '/auth/registro', '/auth/renovar'];

let renovando: Promise<string | null> | null = null;

async function intentarRenovar(): Promise<string | null> {
  if (!renovando) {
    renovando = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return null;
        const { data } = await axios.post(`${apiBaseUrl}/auth/renovar`, { refreshToken });
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.dispatchEvent(new Event('nomahud:sesion-renovada'));
        return data.token as string;
      } catch {
        return null;
      } finally {
        renovando = null;
      }
    })();
  }
  return renovando;
}

function cerrarSesionLocal() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('usuario');
  if (window.location.pathname !== '/inicio-sesion') {
    window.location.href = '/inicio-sesion';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url: string = original?.url ?? '';
    const esSinRefresh = RUTAS_SIN_REFRESH.some((ruta) => url.includes(ruta));
    if (error.response?.status === 401 && !esSinRefresh && !original?._reintento) {
      original._reintento = true;
      const nuevoToken = await intentarRenovar();
      if (nuevoToken) {
        original.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(original);
      }
      cerrarSesionLocal();
    }
    return Promise.reject(error);
  },
);

export default api;
