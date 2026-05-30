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
  presupuesto: number;
  moneda: string;
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
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export default function ListaProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/proyectos').then(({ data }) => {
      setProyectos(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando proyectos...</div>;

  const tareasPendientes = (p: Proyecto) =>
    p.tareas?.filter((t: any) => t.estado !== 'completada' && t.estado !== 'cancelada').length || 0;

  const tareasTotales = (p: Proyecto) => p.tareas?.length || 0;

  return (
    <div>
      <div className="page-header">
        <h1>Proyectos</h1>
        <Link to="/proyectos/nuevo" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
          + Nuevo proyecto
        </Link>
      </div>

      {proyectos.length === 0 ? (
        <div className="perfil-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Aún no tienes proyectos. ¡Crea tu primer proyecto!
          </p>
          <Link to="/proyectos/nuevo" className="btn-primary" style={{ width: 'auto', textDecoration: 'none', display: 'inline-block' }}>
            Crear proyecto
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {proyectos.map((p) => (
            <Link
              key={p.id}
              to={`/proyectos/${p.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="perfil-section" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{p.nombre}</h3>
                      <span className={`badge ${ESTADOS[p.estado]?.badge || 'badge-warning'}`}>
                        {ESTADOS[p.estado]?.label || p.estado}
                      </span>
                      <span className="badge badge-warning" style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--primary)', border: '1px solid rgba(124,58,237,0.2)' }}>
                        {PRIORIDADES[p.prioridad] || p.prioridad}
                      </span>
                    </div>
                    {p.descripcion && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        {p.descripcion.length > 120 ? p.descripcion.slice(0, 120) + '...' : p.descripcion}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {p.clienteRel && <span>Cliente: {p.clienteRel.nombre}{p.clienteRel.empresa ? ` (${p.clienteRel.empresa})` : ''}</span>}
                      {p.presupuesto != null && <span>Presupuesto: {p.moneda} {Number(p.presupuesto).toLocaleString()}</span>}
                      <span>Tareas: {tareasTotales(p)} ({tareasPendientes(p)} pendientes)</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
