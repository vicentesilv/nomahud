import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Viaje {
  id: number;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  presupuesto: number;
  moneda: string;
  notas: string;
  createdAt: string;
}

const estados: Record<string, { label: string; color: string }> = {
  planificado: { label: 'Planificado', color: 'var(--accent)' },
  en_curso: { label: 'En curso', color: '#22c55e' },
  completado: { label: 'Completado', color: '#6366f1' },
  cancelado: { label: 'Cancelado', color: '#ef4444' },
};

function IconMapPin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTravel() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
    </svg>
  );
}


export default function ListaViajes() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/viajes').then(({ data }) => {
      setViajes(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-viajes">
        <div className="page-header"><h1>Viajes</h1></div>
        <div className="viajes-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-viajes">
      <div className="page-header">
        <h1>Viajes</h1>
        <div className="page-header-actions">
          <Link to="/viajes/nuevo" className="btn-primary btn-icon">
            <IconPlus />
            Nuevo viaje
          </Link>
        </div>
      </div>

      {viajes.length === 0 ? (
        <div className="viajes-empty">
          <IconTravel />
          <h3>No hay viajes todavía</h3>
          <p>Planificá tu primer viaje para empezar.</p>
          <Link to="/viajes/nuevo" className="btn-primary btn-icon" style={{ width: 'auto' }}>
            <IconPlus />
            Planificar viaje
          </Link>
        </div>
      ) : (
        <div className="viajes-grid">
          {viajes.map((v, idx) => {
            const badge = estados[v.estado] || estados.planificado;
            return (
              <Link
                key={v.id}
                to={`/viajes/${v.id}`}
                className="viaje-card"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="viaje-card-header">
                  <div className="viaje-card-icon">
                    <IconMapPin />
                  </div>
                  <span className="viaje-card-estado" style={{ borderColor: badge.color, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                <h3 className="viaje-card-destino">{v.destino}</h3>
                <div className="viaje-card-meta">
                  <span>
                    <IconCalendar /> {v.fechaInicio}{v.fechaFin ? ` → ${v.fechaFin}` : ''}
                  </span>
                  {v.presupuesto != null && (
                    <span>
                      <IconDollar /> {Number(v.presupuesto).toLocaleString('es-MX', { style: 'currency', currency: v.moneda || 'MXN' })}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
