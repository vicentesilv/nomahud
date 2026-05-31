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

const badges: Record<string, { label: string; color: string }> = {
  planificado: { label: 'Planificado', color: 'var(--accent)' },
  en_curso: { label: 'En curso', color: '#22c55e' },
  completado: { label: 'Completado', color: '#6366f1' },
  cancelado: { label: 'Cancelado', color: '#ef4444' },
};

export default function ListaViajes() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/viajes').then(({ data }) => {
      setViajes(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando viajes...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Viajes</h1>
        <Link to="/viajes/nuevo" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
          + Nuevo viaje
        </Link>
      </div>

      {viajes.length === 0 ? (
        <div className="perfil-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Aún no tienes viajes registrados.
          </p>
          <Link to="/viajes/nuevo" className="btn-primary" style={{ width: 'auto', textDecoration: 'none', display: 'inline-block' }}>
            Planificar viaje
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {viajes.map((v) => {
            const badge = badges[v.estado] || badges.planificado;
            return (
              <Link
                key={v.id}
                to={`/viajes/${v.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="perfil-section" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{v.destino}</h3>
                        <span style={{
                          fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px',
                          border: `1px solid ${badge.color}`, color: badge.color,
                        }}>
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        <span>📅 {v.fechaInicio}{v.fechaFin ? ` → ${v.fechaFin}` : ''}</span>
                        {v.presupuesto != null && (
                          <span>💰 {Number(v.presupuesto).toLocaleString('es-MX', { style: 'currency', currency: v.moneda || 'MXN' })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
