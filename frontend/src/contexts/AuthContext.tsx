import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  ciudad?: string;
  fechaNacimiento?: string;
  emailVerificado: boolean;
  estadoCuenta: string;
  rol?: 'normal' | 'invitado';
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (nombre: string, correo: string, contrasena: string, ciudad?: string, fechaNacimiento?: string, invitacionToken?: string) => Promise<{ token?: string; refreshToken?: string; advertencia?: string }>;
  establecerSesion: (token: string, refreshToken: string | undefined, usuario: Usuario) => void;
  refreshUsuario: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function guardarSesion(token: string, refreshToken: string | undefined, usuario: Usuario) {
  localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function limpiarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('usuario');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsuario = localStorage.getItem('usuario');
    if (storedToken && storedUsuario) {
      try {
        const parsed = JSON.parse(storedUsuario);
        if (parsed && typeof parsed === 'object' && typeof parsed.id === 'number') {
          setToken(storedToken);
          setUsuario(parsed);
        } else {
          limpiarSesion();
        }
      } catch {
        limpiarSesion();
      }
    }
    setLoading(false);

    const alRenovar = () => {
      setToken(localStorage.getItem('token'));
      try {
        const raw = localStorage.getItem('usuario');
        if (raw) setUsuario(JSON.parse(raw));
      } catch { /* noop */ }
    };
    window.addEventListener('nomahud:sesion-renovada', alRenovar);
    return () => window.removeEventListener('nomahud:sesion-renovada', alRenovar);
  }, []);

  const login = async (correo: string, contrasena: string) => {
    const { data } = await api.post('/auth/inicio-sesion', { correo, contrasena });
    guardarSesion(data.token, data.refreshToken, data.usuario);
    setToken(data.token);
    setUsuario(data.usuario);
  };

  const register = async (nombre: string, correo: string, contrasena: string, ciudad?: string, fechaNacimiento?: string, invitacionToken?: string) => {
    const { data } = await api.post('/auth/registro', { nombre, correo, contrasena, ciudad, fechaNacimiento, invitacionToken });
    if (data?.token && data?.usuario) {
      guardarSesion(data.token, data.refreshToken, data.usuario);
      setToken(data.token);
      setUsuario(data.usuario);
    }
    return { token: data?.token as string | undefined, refreshToken: data?.refreshToken as string | undefined, advertencia: data?.advertencia as string | undefined };
  };

  const establecerSesion = (nuevoToken: string, nuevoRefresh: string | undefined, nuevoUsuario: Usuario) => {
    guardarSesion(nuevoToken, nuevoRefresh, nuevoUsuario);
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  };

  const refreshUsuario = async () => {
    if (!usuario) return;
    try {
      const { data } = await api.get(`/usuarios/${usuario.id}`);
      const actualizado = { ...usuario, ...data };
      localStorage.setItem('usuario', JSON.stringify(actualizado));
      setUsuario(actualizado);
    } catch { /* noop */ }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const actual = localStorage.getItem('token');
    if (refreshToken && actual) {
      api.post('/auth/cerrar-sesion', { refreshToken }).catch(() => {});
    }
    limpiarSesion();
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, register, establecerSesion, refreshUsuario, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
