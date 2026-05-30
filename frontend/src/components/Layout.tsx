import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/inicio-sesion');
  };

  const initials = usuario?.nombre
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <NavLink to="/mi-perfil" className="sidebar-logo">
            <div className="sidebar-logo-icon">✦</div>
            <div className="sidebar-logo-text">Noma<span>Hud</span></div>
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navegación</div>

          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">◉</span>
            Dashboard
          </NavLink>
          <NavLink to="/mi-perfil" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">◎</span>
            Mi Perfil
          </NavLink>

          <div className="nav-section-label">Gestión</div>

          <NavLink to="/proyectos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">▣</span>
            Proyectos
          </NavLink>
          <NavLink to="/tareas" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">☐</span>
            Tareas
          </NavLink>
          <NavLink to="/clientes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">◉</span>
            Clientes
          </NavLink>

          <div className="nav-section-label">Finanzas & Tiempo</div>

          <NavLink to="/finanzas" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">⟡</span>
            Finanzas
          </NavLink>
          <NavLink to="/tiempo" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">◷</span>
            Tiempo
          </NavLink>

          <div className="nav-section-label">Viajes</div>

          <NavLink to="/viajes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">✦</span>
            Viajes
          </NavLink>
          <NavLink to="/documentos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-link-icon">◈</span>
            Documentos
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{usuario?.nombre}</div>
              <div className="sidebar-user-status">En línea</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            ✕ Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
