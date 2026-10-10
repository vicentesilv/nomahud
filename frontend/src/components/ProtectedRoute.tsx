import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Secciones permitidas para cuentas de invitado (resto → /proyectos). */
const RUTAS_INVITADO = [/^\/proyectos(\/.*)?$/, /^\/mi-perfil\/?$/];

export default function ProtectedRoute() {
  const { usuario, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }

  if (!usuario || !token) {
    return <Navigate to="/inicio-sesion" replace />;
  }

  if (usuario.rol === 'invitado' && !RUTAS_INVITADO.some((r) => r.test(location.pathname))) {
    return <Navigate to="/proyectos" replace />;
  }

  return <Outlet />;
}
