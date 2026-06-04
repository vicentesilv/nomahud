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

function IconTrendingUp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconTrendingDown() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function IconBalance() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function IconReceipt() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" />
    </svg>
  );
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

  if (loading) {
    return (
      <div className="page-finanzas">
        <div className="page-header"><h1>Finanzas</h1></div>
        <div className="finanzas-resumen-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filtradas = filtro === 'todas'
    ? transacciones
    : transacciones.filter((t) => t.tipo === filtro);

  return (
    <div className="page-finanzas">
      <div className="page-header">
        <h1>Finanzas</h1>
        <div className="page-header-actions">
          <Link to="/finanzas/nuevo" className="btn-primary btn-icon">
            <IconPlus />
            Nueva transacción
          </Link>
        </div>
      </div>

      <div className="finanzas-resumen">
        <div className="finanzas-resumen-card finanzas-resumen-ingresos">
          <div className="finanzas-resumen-icon">
            <IconTrendingUp />
          </div>
          <div className="finanzas-resumen-info">
            <span className="finanzas-resumen-label">Ingresos</span>
            <span className="finanzas-resumen-value finanzas-resumen-positive">
              +{Number(resumen.totalIngresos).toLocaleString()} USD
            </span>
          </div>
        </div>
        <div className="finanzas-resumen-card finanzas-resumen-gastos">
          <div className="finanzas-resumen-icon">
            <IconTrendingDown />
          </div>
          <div className="finanzas-resumen-info">
            <span className="finanzas-resumen-label">Gastos</span>
            <span className="finanzas-resumen-value finanzas-resumen-negative">
              -{Number(resumen.totalGastos).toLocaleString()} USD
            </span>
          </div>
        </div>
        <div className="finanzas-resumen-card">
          <div className="finanzas-resumen-icon">
            <IconBalance />
          </div>
          <div className="finanzas-resumen-info">
            <span className="finanzas-resumen-label">Balance</span>
            <span className={`finanzas-resumen-value ${resumen.balance >= 0 ? 'finanzas-resumen-positive' : 'finanzas-resumen-negative'}`}>
              {resumen.balance >= 0 ? '+' : ''}{Number(resumen.balance).toLocaleString()} USD
            </span>
          </div>
        </div>
      </div>

      <div className="finanzas-filtros">
        {(['todas', 'ingreso', 'gasto'] as const).map((f) => (
          <button
            key={f}
            className={`finanzas-filtro-btn ${filtro === f ? 'active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f === 'todas' ? 'Todas' : f === 'ingreso' ? 'Ingresos' : 'Gastos'}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="finanzas-empty">
          <IconReceipt />
          <h3>No hay transacciones</h3>
          <p>{filtro === 'todas' ? 'Registrá tu primer movimiento financiero.' : 'No hay transacciones de este tipo.'}</p>
          <Link to="/finanzas/nuevo" className="btn-primary btn-icon" style={{ width: 'auto' }}>
            <IconPlus />
            Nueva transacción
          </Link>
        </div>
      ) : (
        <div className="finanzas-lista">
          {filtradas.map((t, idx) => (
            <div key={t.id} className="finanzas-item" style={{ animationDelay: `${idx * 0.04}s` }}>
              <div className="finanzas-item-left">
                <div className="finanzas-item-top">
                  <span className={`finanzas-item-badge ${t.tipo === 'ingreso' ? 'finanzas-badge-ingreso' : 'finanzas-badge-gasto'}`}>
                    {t.tipo}
                  </span>
                  <span className="finanzas-item-categoria">{t.categoria}</span>
                  {t.proyecto && (
                    <span className="finanzas-item-proyecto">{t.proyecto.nombre}</span>
                  )}
                </div>
                {t.descripcion && (
                  <p className="finanzas-item-desc">{t.descripcion}</p>
                )}
                <div className="finanzas-item-meta">
                  <span>{t.fecha}</span>
                  {t.cliente && <span>· {t.cliente.nombre}</span>}
                </div>
              </div>
              <div className="finanzas-item-right">
                <span className={`finanzas-item-monto ${t.tipo === 'ingreso' ? 'finanzas-monto-positivo' : 'finanzas-monto-negativo'}`}>
                  {t.tipo === 'ingreso' ? '+' : '-'}{Number(t.monto).toLocaleString()} {t.moneda}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
