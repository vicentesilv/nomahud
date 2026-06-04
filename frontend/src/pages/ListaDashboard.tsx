import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ResumenDashboard {
  proyectosActivos: number;
  totalClientes: number;
  resumenFinanzas: { ingresos: number; gastos: number; balance: number };
  horasMes: number;
  viajesProximos: { id: number; destino: string; fechaInicio: string; estado: string }[];
  tareasPendientes: { id: number; titulo: string; prioridad: string; estado: string; fechaVencimiento: string | null; proyecto: { nombre: string } }[];
  actividadReciente: { tipo: string; descripcion: string; fecha: string; id: number }[];
}

const PRIORIDAD_COLOR: Record<string, string> = { critica: '#ef4444', alta: '#f59e0b', media: '#06b6d4', baja: '#8888a0' };
const PRIORIDAD_LABEL: Record<string, string> = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' };
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada', cancelada: 'Cancelada' };

function IconFolder() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconTrendUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconTrendDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function IconCheckSquare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function ListaDashboard() {
  const [data, setData] = useState<ResumenDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => { setData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-dashboard">
        <div className="page-header"><h1>Dashboard</h1></div>
        <div className="dashboard-skeleton">
          <div className="dashboard-stats">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-stat">
                <div className="skeleton-line w-40" />
                <div className="skeleton-line w-24" style={{ height: '28px', marginTop: '0.5rem' }} />
              </div>
            ))}
          </div>
          <div className="dashboard-grid">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line w-40" />
                <div className="skeleton-line w-full" />
                <div className="skeleton-line w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-dashboard">
        <div className="page-header"><h1>Dashboard</h1></div>
        <div className="dashboard-error">
          <IconAlert />
          <p>Error al cargar el dashboard</p>
          <button onClick={() => window.location.reload()} className="btn-primary btn-icon" style={{ width: 'auto', marginTop: '0.5rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const actividadIcon: Record<string, string> = { ingreso: '💰', gasto: '💸', tarea_completada: '✅' };

  return (
    <div className="page-dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-header-sub">Resumen general de tu actividad</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card stat-card-purple">
          <div className="stat-icon"><IconFolder /></div>
          <div className="stat-info">
            <span className="stat-value">{data.proyectosActivos}</span>
            <span className="stat-label">Proyectos activos</span>
          </div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="stat-icon"><IconUsers /></div>
          <div className="stat-info">
            <span className="stat-value">{data.totalClientes}</span>
            <span className="stat-label">Clientes</span>
          </div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-icon"><IconDollar /></div>
          <div className="stat-info">
            <span className="stat-value">${data.resumenFinanzas.ingresos.toFixed(0)}</span>
            <span className="stat-label">Ingresos del mes</span>
          </div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-icon"><IconClock /></div>
          <div className="stat-info">
            <span className="stat-value">{data.horasMes.toFixed(1)}h</span>
            <span className="stat-label">Horas del mes</span>
          </div>
        </div>
      </div>

      <div className="dashboard-finanzas">
        <div className="finanzas-card">
          <span className="finanzas-label">Gastos del mes</span>
          <span className="finanzas-value finanzas-value-negative">${data.resumenFinanzas.gastos.toFixed(2)}</span>
          <div className="finanzas-bar">
            <div className="finanzas-bar-fill finanzas-bar-negative" style={{ width: `${Math.min((data.resumenFinanzas.gastos / (data.resumenFinanzas.ingresos || 1)) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="finanzas-card">
          <span className="finanzas-label">Balance del mes</span>
          <span className={`finanzas-value ${data.resumenFinanzas.balance >= 0 ? 'finanzas-value-positive' : 'finanzas-value-negative'}`}>
            {data.resumenFinanzas.balance >= 0 ? '+' : ''}${data.resumenFinanzas.balance.toFixed(2)}
          </span>
          <div className="finanzas-bar">
            <div className={`finanzas-bar-fill ${data.resumenFinanzas.balance >= 0 ? 'finanzas-bar-positive' : 'finanzas-bar-negative'}`} style={{ width: `${Math.min(Math.abs(data.resumenFinanzas.balance) / (Math.max(data.resumenFinanzas.ingresos, data.resumenFinanzas.gastos) || 1) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <IconCheckSquare />
            <h3>Tareas Pendientes</h3>
            {data.tareasPendientes.length > 0 && <span className="dashboard-card-count">{data.tareasPendientes.length}</span>}
          </div>
          {data.tareasPendientes.length === 0 ? (
            <p className="dashboard-card-empty">No hay tareas pendientes</p>
          ) : (
            <div className="dashboard-list">
              {data.tareasPendientes.slice(0, 8).map((t) => (
                <div key={t.id} className="dashboard-list-item" onClick={() => navigate(`/tareas`)}>
                  <div className="dashboard-list-item-main">
                    <span className="priority-dot" style={{ background: PRIORIDAD_COLOR[t.prioridad] }} />
                    <div>
                      <span className="dashboard-list-item-title">{t.titulo}</span>
                      <div className="dashboard-list-item-meta">
                        {t.proyecto?.nombre && <span>{t.proyecto.nombre}</span>}
                        {t.fechaVencimiento && (
                          <>
                            {t.proyecto?.nombre && <span className="meta-sep">·</span>}
                            <span>{new Date(t.fechaVencimiento).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="priority-badge" style={{
                    background: `${PRIORIDAD_COLOR[t.prioridad]}1a`,
                    color: PRIORIDAD_COLOR[t.prioridad],
                    borderColor: `${PRIORIDAD_COLOR[t.prioridad]}40`,
                  }}>
                    {PRIORIDAD_LABEL[t.prioridad]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <IconMapPin />
            <h3>Próximos Viajes</h3>
            {data.viajesProximos.length > 0 && <span className="dashboard-card-count">{data.viajesProximos.length}</span>}
          </div>
          {data.viajesProximos.length === 0 ? (
            <p className="dashboard-card-empty">No hay viajes próximos</p>
          ) : (
            <div className="dashboard-list">
              {data.viajesProximos.map((v) => (
                <div key={v.id} className="dashboard-list-item" onClick={() => navigate(`/viajes/${v.id}`)}>
                  <div className="dashboard-list-item-main">
                    <div className="viaje-icon">
                      <IconMapPin />
                    </div>
                    <div>
                      <span className="dashboard-list-item-title">{v.destino}</span>
                      <div className="dashboard-list-item-meta">
                        <span>{new Date(v.fechaInicio).toLocaleDateString()}</span>
                        <span className="meta-sep">·</span>
                        <span>{ESTADO_LABEL[v.estado] || v.estado}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-card dashboard-card-full">
        <div className="dashboard-card-header">
          <IconActivity />
          <h3>Actividad Reciente</h3>
        </div>
        {data.actividadReciente.length === 0 ? (
          <p className="dashboard-card-empty">Sin actividad reciente</p>
        ) : (
          <div className="activity-timeline">
            {data.actividadReciente.map((a, i) => (
              <div key={`${a.tipo}-${a.id}-${i}`} className={`timeline-item ${i < data.actividadReciente.length - 1 ? 'timeline-item-linked' : ''}`}>
                <div className="timeline-dot">{actividadIcon[a.tipo] || '•'}</div>
                <div className="timeline-content">
                  <span className="timeline-desc">{a.descripcion}</span>
                  <span className="timeline-date">{new Date(a.fecha).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
