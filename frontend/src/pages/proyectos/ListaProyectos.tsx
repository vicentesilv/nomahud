import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  cliente: string;
  clienteRel: { id: number; nombre: string; empresa: string } | null;
  ganancia: number;
  fechaInicio: string;
  fechaFin: string;
  tareas: any[];
  createdAt: string;
}

const ESTADOS: Record<string, { label: string; badge: string }> = {
  activo: { label: 'Activo', badge: 'badge-success' },
  completado: { label: 'Completado', badge: 'badge-success' },
  en_pausa: { label: 'En pausa', badge: 'badge-warning' },
  cancelado: { label: 'Cancelado', badge: 'badge-error' },
};

const PRIORIDADES: Record<string, string> = {
  baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica',
};

function IconFolder() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export default function ListaProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'tarjeta' | 'lista'>('tarjeta');

  useEffect(() => {
    api.get('/proyectos').then(({ data }) => {
      setProyectos(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-proyectos">
        <div className="page-header"><h1>Proyectos</h1></div>
        <div className="proyectos-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tareasPendientes = (p: Proyecto) =>
    p.tareas?.filter((t: any) => t.estado !== 'completada' && t.estado !== 'cancelada').length || 0;
  const tareasTotales = (p: Proyecto) => p.tareas?.length || 0;

  return (
    <div className="page-proyectos">
      <div className="page-header">
        <h1>Proyectos</h1>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${vista === 'tarjeta' ? 'active' : ''}`}
              onClick={() => setVista('tarjeta')}
              title="Vista en tarjetas"
            >
              <IconGrid />
            </button>
            <button
              className={`view-toggle-btn ${vista === 'lista' ? 'active' : ''}`}
              onClick={() => setVista('lista')}
              title="Vista en lista"
            >
              <IconList />
            </button>
          </div>
          <Link to="/proyectos/nuevo" className="btn-primary btn-icon">
            <IconPlus />
            Nuevo proyecto
          </Link>
        </div>
      </div>

      {proyectos.length === 0 ? (
        <div className="proyectos-empty">
          <div className="proyectos-empty-icon"><IconFolder /></div>
          <h3>No hay proyectos todavía</h3>
          <p>Creá tu primer proyecto para empezar a organizar tu trabajo.</p>
          <Link to="/proyectos/nuevo" className="btn-primary btn-icon" style={{ width: 'auto' }}>
            <IconPlus />
            Crear proyecto
          </Link>
        </div>
      ) : vista === 'tarjeta' ? (
        <div className="proyectos-grid">
          {proyectos.map((p, idx) => (
            <Link
              key={p.id}
              to={`/proyectos/${p.id}`}
              className={`proyecto-card prioridad-${p.prioridad}`}
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <div className="proyecto-card-header">
                <div className="proyecto-card-titulo">
                  {p.nombre}
                  <span className={`badge ${ESTADOS[p.estado]?.badge || 'badge-warning'}`}>
                    {ESTADOS[p.estado]?.label || p.estado}
                  </span>
                </div>
                <span className="badge-prioridad" style={{
                  background: `${p.prioridad === 'critica' ? '#ef4444' : p.prioridad === 'alta' ? '#f59e0b' : p.prioridad === 'media' ? '#06b6d4' : '#8888a0'}1a`,
                  color: p.prioridad === 'critica' ? '#ef4444' : p.prioridad === 'alta' ? '#f59e0b' : p.prioridad === 'media' ? '#06b6d4' : '#8888a0',
                  borderColor: `${p.prioridad === 'critica' ? '#ef4444' : p.prioridad === 'alta' ? '#f59e0b' : p.prioridad === 'media' ? '#06b6d4' : '#8888a0'}40`,
                }}>
                  {PRIORIDADES[p.prioridad] || p.prioridad}
                </span>
              </div>

              {p.descripcion && (
                <p className="proyecto-card-desc">{p.descripcion}</p>
              )}

              <div className="proyecto-card-meta">
                {p.clienteRel && (
                  <span><IconUser /> {p.clienteRel.nombre}</span>
                )}
                <span><IconList /> {tareasTotales(p)} tareas ({tareasPendientes(p)} pendientes)</span>
                {p.ganancia != null && (
                  <span><IconDollar /> ${Number(p.ganancia).toLocaleString()}</span>
                )}
                {p.fechaFin && (
                  <span><IconClock /> {new Date(p.fechaFin).toLocaleDateString()}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="proyectos-list">
          {proyectos.map((p, idx) => (
            <Link
              key={p.id}
              to={`/proyectos/${p.id}`}
              className={`proyecto-list-item prioridad-${p.prioridad}`}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <div className="proyecto-list-item-main">
                <span className="proyecto-list-item-nombre">{p.nombre}</span>
                <div className="proyecto-list-item-badges">
                  <span className={`badge ${ESTADOS[p.estado]?.badge || 'badge-warning'}`}>
                    {ESTADOS[p.estado]?.label || p.estado}
                  </span>
                  <span className="badge-prioridad" style={{
                    background: `${p.prioridad === 'critica' ? '#ef4444' : p.prioridad === 'alta' ? '#f59e0b' : p.prioridad === 'media' ? '#06b6d4' : '#8888a0'}1a`,
                    color: p.prioridad === 'critica' ? '#ef4444' : p.prioridad === 'alta' ? '#f59e0b' : p.prioridad === 'media' ? '#06b6d4' : '#8888a0',
                    borderColor: `${p.prioridad === 'critica' ? '#ef4444' : p.prioridad === 'alta' ? '#f59e0b' : p.prioridad === 'media' ? '#06b6d4' : '#8888a0'}40`,
                  }}>
                    {PRIORIDADES[p.prioridad] || p.prioridad}
                  </span>
                </div>
              </div>
              <div className="proyecto-list-item-meta">
                {p.clienteRel && <span>{p.clienteRel.nombre}</span>}
                <span>{tareasTotales(p)} tareas</span>
                {p.ganancia != null && <span>${Number(p.ganancia).toLocaleString()}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
