import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Registro {
  id: number;
  horas: number;
  fecha: string;
  descripcion: string;
  proyecto: { id: number; nombre: string } | null;
  tarea: { id: number; titulo: string } | null;
}

export default function ListaTiempo() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [resumen, setResumen] = useState({ totalHoras: 0, registrosHoy: 0 });
  const [loading, setLoading] = useState(true);
  const [proyectoFiltro, setProyectoFiltro] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/tiempo'),
      api.get('/tiempo/resumen'),
    ]).then(([rData, sData]) => {
      setRegistros(rData.data);
      setResumen(sData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando registros...</div>;

  const proyectosUnicos = [...new Map(
    registros.filter((r) => r.proyecto).map((r) => [r.proyecto!.id, r.proyecto]),
  ).values()];

  const filtrados = proyectoFiltro
    ? registros.filter((r) => r.proyecto?.id === Number(proyectoFiltro))
    : registros;

  const horasFiltradas = filtrados.reduce((sum, r) => sum + Number(r.horas), 0);

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div className="page-header">
        <h1>Tiempo</h1>
        <Link to="/tiempo/nuevo" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
          + Registrar horas
        </Link>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="perfil-section">
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>◷ Total horas</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{resumen.totalHoras}h</p>
        </div>
        <div className="perfil-section">
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>◷ Registros hoy</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{resumen.registrosHoy}</p>
        </div>
        <div className="perfil-section">
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>◷ Horas filtradas</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{horasFiltradas}h</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filtrar por proyecto:</label>
        <select
          value={proyectoFiltro}
          onChange={(e) => setProyectoFiltro(e.target.value)}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.85rem',
          }}
        >
          <option value="">Todos</option>
          {proyectosUnicos.map((p: any) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtrados.length === 0 ? (
        <div className="perfil-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hay registros de tiempo.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtrados.map((r) => (
            <div key={r.id} className="perfil-section" style={{ padding: '0.85rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{Number(r.horas)}h</span>
                    {r.proyecto && (
                      <span style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{r.proyecto.nombre}</span>
                    )}
                    {r.tarea && (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>· {r.tarea.titulo}</span>
                    )}
                  </div>
                  {r.descripcion && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.descripcion}</p>
                  )}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', flexShrink: 0 }}>
                  {r.fecha}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
