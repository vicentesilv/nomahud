import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { usuario, token, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }

  if (!usuario || !token) {
    return <Navigate to="/inicio-sesion" replace />;
  }

  return <Outlet />;
}
