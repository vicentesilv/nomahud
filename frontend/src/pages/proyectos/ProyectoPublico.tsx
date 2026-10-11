import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useDivisa, DivisaProvider } from '../../contexts/DivisaContext';

interface TareaPublica {
  id: number;
  titulo: string;
  estado: string;
  prioridad: string;
  fechaVencimiento: string | null;
}

interface ProyectoPublico {
  nombre: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  cliente: string;
  creador: string;
  progreso: number;
  totalTareas: number;
  tareasCompletadas: number;
  tareas: TareaPublica[];
  moneda: string;
  ganancia: number;
  fechaInicio: string;
  fechaFin: string;
}

const ESTADOS: Record<string, string> = {
  activo: 'Activo',
  completado: 'Completado',
  en_pausa: 'En pausa',
  cancelado: 'Cancelado',
};

const PRIORIDAD_COLOR: Record<string, string> = {
  critica: '#ef4444',
  alta: '#f59e0b',
  media: '#06b6d4',
  baja: '#8888a0',
};

export default function ProyectoPublico() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { formatear } = useDivisa();
  const [data, setData] = useState<ProyectoPublico | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido: falta el token');
      setLoading(false);
      return;
    }
    api.get(`/proyectos-publico/${token}`)
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        const m = err.response?.data?.message;
        setError(typeof m === 'string' ? m : 'No se pudo cargar el proyecto');
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="page-tareas" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className="loading">Cargando proyecto...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-tareas" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h1>Proyecto no disponible</h1>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>{error}</p>
        <Link to="/inicio-sesion" className="btn-secondary" style={{ width: 'auto' }}>
          Ir al inicio
        </Link>
      </div>
    );
  }

  const badgeEstado = data.estado === 'activo' || data.estado === 'completado' ? 'badge-success' : data.estado === 'en_pausa' ? 'badge-warning' : 'badge-error';

  return (
    <DivisaProvider>
    <div className="page-tareas" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>{data.nombre}</h1>
        <span className={`badge ${badgeEstado}`}>{ESTADOS[data.estado] || data.estado}</span>
      </div>

      <div className="proyecto-info-card">
        {data.descripcion && (
          <div className="proyecto-info-desc">
            <span className="proyecto-info-label">Descripción</span>
            <p>{data.descripcion}</p>
          </div>
        )}
        <div className="proyecto-info-item">
          <span className="proyecto-info-label">Cliente</span>
          <span className="proyecto-info-value">{data.cliente || '—'}</span>
        </div>
        <div className="proyecto-info-item">
          <span className="proyecto-info-label">Responsable</span>
          <span className="proyecto-info-value">{data.creador || '—'}</span>
        </div>
        <div className="proyecto-info-item">
          <span className="proyecto-info-label">Prioridad</span>
          <span style={{ color: PRIORIDAD_COLOR[data.prioridad], fontWeight: 600 }}>
            {data.prioridad}
          </span>
        </div>
        {data.ganancia != null && (
          <div className="proyecto-info-item">
            <span className="proyecto-info-label">Ganancia</span>
            <span className="proyecto-info-value">{formatear(Number(data.ganancia), data.moneda)}</span>
          </div>
        )}
        {data.fechaInicio && (
          <div className="proyecto-info-item">
            <span className="proyecto-info-label">Inicio</span>
            <span className="proyecto-info-value">{new Date(data.fechaInicio).toLocaleDateString()}</span>
          </div>
        )}
        {data.fechaFin && (
          <div className="proyecto-info-item">
            <span className="proyecto-info-label">Fin</span>
            <span className="proyecto-info-value">{new Date(data.fechaFin).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="proyecto-info-card">
        <div className="proyecto-info-item">
          <span className="proyecto-info-label">Progreso</span>
          <span className="proyecto-info-value">{data.progreso}% ({data.tareasCompletadas}/{data.totalTareas} tareas)</span>
        </div>
        <div className="kanban-progress" style={{ marginTop: '0.5rem' }}>
          <div className="kanban-progress-bar">
            <div className="kanban-progress-fill" style={{ width: `${data.progreso}%` }} />
          </div>
        </div>
      </div>

      <div className="proyecto-info-card">
        <h3 style={{ marginBottom: '0.75rem' }}>Tareas</h3>
        {data.tareas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay tareas en este proyecto.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.tareas.map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${PRIORIDAD_COLOR[t.prioridad]}`,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span>{t.titulo}</span>
                <span className={`badge ${t.estado === 'completada' ? 'badge-success' : t.estado === 'cancelada' ? 'badge-error' : 'badge-warning'}`}>
                  {t.estado}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Vista pública generada por {data.creador || 'el propietario'} · Nomahud
      </p>
    </div>
    </DivisaProvider>
  );
}
