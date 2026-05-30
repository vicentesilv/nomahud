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
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  register: (nombre: string, correo: string, contrasena: string, ciudad?: string, fechaNacimiento?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsuario = localStorage.getItem('usuario');
    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
    }
    setLoading(false);
  }, []);

  const login = async (correo: string, contrasena: string) => {
    const { data } = await api.post('/auth/inicio-sesion', { correo, contrasena });
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
  };

  const register = async (nombre: string, correo: string, contrasena: string, ciudad?: string, fechaNacimiento?: string) => {
    await api.post('/auth/registro', { nombre, correo, contrasena, ciudad, fechaNacimiento });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, register, logout, loading }}>
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
