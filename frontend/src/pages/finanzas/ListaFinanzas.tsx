import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Transaccion {
  id: number;
  tipo: string;
  categoria: string;
  monto: number;
  moneda: string;
  descripcion: string;
  fecha: string;
  proyecto: { id: number; nombre: string } | null;
  cliente: { id: number; nombre: string } | null;
}

export default function ListaFinanzas() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [resumen, setResumen] = useState({ totalIngresos: 0, totalGastos: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    Promise.all([
      api.get('/finanzas'),
      api.get('/finanzas/resumen'),
    ]).then(([tData, rData]) => {
      setTransacciones(tData.data);
      setResumen(rData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando finanzas...</div>;

  const filtradas = filtro === 'todas'
    ? transacciones
    : transacciones.filter((t) => t.tipo === filtro);

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div className="page-header">
        <h1>Finanzas</h1>
        <Link to="/finanzas/nuevo" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
          + Nueva transacción
        </Link>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="perfil-section">
          <h3 style={{ color: 'var(--success)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⟡ Ingresos</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
            +{Number(resumen.totalIngresos).toLocaleString()} USD
          </p>
        </div>
        <div className="perfil-section">
          <h3 style={{ color: 'var(--error)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⟡ Gastos</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>
            -{Number(resumen.totalGastos).toLocaleString()} USD
          </p>
        </div>
        <div className="perfil-section">
          <h3 style={{ color: resumen.balance >= 0 ? 'var(--success)' : 'var(--error)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⟡ Balance</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: resumen.balance >= 0 ? 'var(--success)' : 'var(--error)' }}>
            {Number(resumen.balance).toLocaleString()} USD
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['todas', 'ingreso', 'gasto'].map((f) => (
          <button
            key={f}
            className={filtro === f ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFiltro(f)}
            style={{ width: 'auto', textTransform: 'capitalize' }}
          >
            {f === 'todas' ? 'Todas' : f === 'ingreso' ? 'Ingresos' : 'Gastos'}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {filtradas.length === 0 ? (
        <div className="perfil-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hay transacciones registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtradas.map((t) => (
            <div key={t.id} className="perfil-section" style={{ padding: '0.85rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
                    <span className={`badge ${t.tipo === 'ingreso' ? 'badge-success' : 'badge-error'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                      {t.tipo}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.categoria}</span>
                    {t.proyecto && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>· {t.proyecto.nombre}</span>
                    )}
                  </div>
                  {t.descripcion && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.descripcion}</p>
                  )}
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    {t.fecha}{t.cliente ? ` · ${t.cliente.nombre}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: t.tipo === 'ingreso' ? 'var(--success)' : 'var(--error)',
                  }}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{Number(t.monto).toLocaleString()} {t.moneda}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
