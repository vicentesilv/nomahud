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

export default function ListaDashboard() {
  const [data, setData] = useState<ResumenDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => { setData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando dashboard...</div>;
  if (!data) return <div className="error-msg">Error al cargar el dashboard</div>;

  const actividadIcon: Record<string, string> = { ingreso: '💰', gasto: '💸', tarea_completada: '✅' };

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Proyectos activos', value: data.proyectosActivos, color: 'var(--primary)' },
          { label: 'Clientes', value: data.totalClientes, color: 'var(--accent)' },
          { label: 'Ingresos del mes', value: `$${data.resumenFinanzas.ingresos.toFixed(2)}`, color: 'var(--success)' },
          { label: 'Horas del mes', value: `${data.horasMes.toFixed(1)}h`, color: 'var(--warning)' },
        ].map((card) => (
          <div key={card.label} className="perfil-section" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="perfil-section" style={{ padding: '1.25rem', textAlign: 'center', gridColumn: 'span 2' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Gastos del mes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--error)' }}>${data.resumenFinanzas.gastos.toFixed(2)}</div>
        </div>
        <div className="perfil-section" style={{ padding: '1.25rem', textAlign: 'center', gridColumn: 'span 2' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Balance del mes</div>
          <div style={{
            fontSize: '1.8rem', fontWeight: '700',
            color: data.resumenFinanzas.balance >= 0 ? 'var(--success)' : 'var(--error)',
          }}>
            ${data.resumenFinanzas.balance.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="perfil-section" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Tareas Pendientes</h3>
          {data.tareasPendientes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay tareas pendientes</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {data.tareasPendientes.slice(0, 8).map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/proyectos/${t.proyecto?.nombre ? '#' : ''}`)}
                  style={{
                    padding: '0.5rem 0.65rem', cursor: 'pointer',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORIDAD_COLOR[t.prioridad], flexShrink: 0 }} />
                      <strong style={{ fontSize: '0.8rem' }}>{t.titulo}</strong>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {PRIORIDAD_LABEL[t.prioridad]}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                    {t.proyecto?.nombre}{t.fechaVencimiento ? ` · ${new Date(t.fechaVencimiento).toLocaleDateString()}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="perfil-section" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Próximos Viajes</h3>
          {data.viajesProximos.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay viajes próximos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {data.viajesProximos.map(v => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/viajes/${v.id}`)}
                  style={{
                    padding: '0.5rem 0.65rem', cursor: 'pointer',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    transition: 'var(--transition)',
                  }}
                >
                  <strong style={{ fontSize: '0.85rem' }}>{v.destino}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                    {new Date(v.fechaInicio).toLocaleDateString()} · {ESTADO_LABEL[v.estado] || v.estado}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="perfil-section" style={{ padding: '1rem' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Actividad Reciente</h3>
        {data.actividadReciente.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin actividad reciente</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {data.actividadReciente.map((a, i) => (
              <div key={`${a.tipo}-${a.id}-${i}`} style={{
                padding: '0.5rem 0.65rem',
                borderBottom: i < data.actividadReciente.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span>{actividadIcon[a.tipo] || '•'}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.85rem' }}>{a.descripcion}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                  {new Date(a.fecha).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
