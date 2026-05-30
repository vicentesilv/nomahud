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

export default function ListaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clientes').then(({ data }) => {
      setClientes(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando clientes...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
        <Link to="/clientes/nuevo" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
          + Nuevo cliente
        </Link>
      </div>

      {clientes.length === 0 ? (
        <div className="perfil-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Aún no tienes clientes registrados.
          </p>
          <Link to="/clientes/nuevo" className="btn-primary" style={{ width: 'auto', textDecoration: 'none', display: 'inline-block' }}>
            Añadir cliente
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {clientes.map((c) => (
            <Link
              key={c.id}
              to={`/clientes/${c.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="perfil-section" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{c.nombre}</h3>
                      {c.empresa && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.empresa}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {c.correo && <span>✉ {c.correo}</span>}
                      {c.telefono && <span>✆ {c.telefono}</span>}
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
