import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Cliente {
  id: number;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  sitioWeb: string;
  notas: string;
  createdAt: string;
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
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

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function initiales(nombre: string) {
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function ListaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'tarjeta' | 'lista'>('tarjeta');

  useEffect(() => {
    api.get('/clientes').then(({ data }) => {
      setClientes(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-clientes">
        <div className="page-header"><h1>Clientes</h1></div>
        <div className="clientes-grid">
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

  return (
    <div className="page-clientes">
      <div className="page-header">
        <h1>Clientes</h1>
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
          <Link to="/clientes/nuevo" className="btn-primary btn-icon">
            <IconPlus />
            Nuevo cliente
          </Link>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="clientes-empty">
          <IconUsers />
          <h3>No hay clientes todavía</h3>
          <p>Agregá tu primer cliente para empezar.</p>
          <Link to="/clientes/nuevo" className="btn-primary btn-icon" style={{ width: 'auto' }}>
            <IconPlus />
            Añadir cliente
          </Link>
        </div>
      ) : vista === 'tarjeta' ? (
        <div className="clientes-grid">
          {clientes.map((c, idx) => {
            const colorIdx = c.id % COLORS.length;
            return (
              <Link
                key={c.id}
                to={`/clientes/${c.id}`}
                className="cliente-card"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="cliente-card-avatar" style={{ background: COLORS[colorIdx] }}>
                  {initiales(c.nombre)}
                </div>
                <div className="cliente-card-info">
                  <div className="cliente-card-nombre">{c.nombre}</div>
                  {c.empresa && <div className="cliente-card-empresa">{c.empresa}</div>}
                </div>
                <div className="cliente-card-contacto">
                  {c.correo && (
                    <span><IconMail /> {c.correo}</span>
                  )}
                  {c.telefono && (
                    <span><IconPhone /> {c.telefono}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="clientes-list">
          {clientes.map((c, idx) => {
            const colorIdx = c.id % COLORS.length;
            return (
              <Link
                key={c.id}
                to={`/clientes/${c.id}`}
                className="cliente-list-item"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div className="cliente-list-item-avatar" style={{ background: COLORS[colorIdx] }}>
                  {initiales(c.nombre)}
                </div>
                <div className="cliente-list-item-main">
                  <span className="cliente-list-item-nombre">{c.nombre}</span>
                  {c.empresa && <span className="cliente-list-item-empresa">{c.empresa}</span>}
                </div>
                <div className="cliente-list-item-meta">
                  {c.correo && <span><IconMail /> {c.correo}</span>}
                  {c.telefono && <span><IconPhone /> {c.telefono}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
