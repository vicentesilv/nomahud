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

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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

function IconTimer() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
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

  if (loading) {
    return (
      <div className="page-tiempo">
        <div className="page-header"><h1>Tiempo</h1></div>
        <div className="tiempo-resumen-skeleton">
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

  const proyectosUnicos = [...new Map(
    registros.filter((r) => r.proyecto).map((r) => [r.proyecto!.id, r.proyecto]),
  ).values()];

  const filtrados = proyectoFiltro
    ? registros.filter((r) => r.proyecto?.id === Number(proyectoFiltro))
    : registros;

  const horasFiltradas = filtrados.reduce((sum, r) => sum + Number(r.horas), 0);

  return (
    <div className="page-tiempo">
      <div className="page-header">
        <h1>Tiempo</h1>
        <div className="page-header-actions">
          <Link to="/tiempo/nuevo" className="btn-primary btn-icon">
            <IconPlus />
            Registrar horas
          </Link>
        </div>
      </div>

      <div className="tiempo-resumen">
        <div className="tiempo-resumen-card">
          <div className="tiempo-resumen-icon">
            <IconClock />
          </div>
          <div className="tiempo-resumen-info">
            <span className="tiempo-resumen-label">Total horas</span>
            <span className="tiempo-resumen-value">{resumen.totalHoras}h</span>
          </div>
        </div>
        <div className="tiempo-resumen-card">
          <div className="tiempo-resumen-icon">
            <IconCalendar />
          </div>
          <div className="tiempo-resumen-info">
            <span className="tiempo-resumen-label">Registros hoy</span>
            <span className="tiempo-resumen-value">{resumen.registrosHoy}</span>
          </div>
        </div>
        <div className="tiempo-resumen-card">
          <div className="tiempo-resumen-icon">
            <IconFilter />
          </div>
          <div className="tiempo-resumen-info">
            <span className="tiempo-resumen-label">Horas filtradas</span>
            <span className="tiempo-resumen-value">{horasFiltradas}h</span>
          </div>
        </div>
      </div>

      <div className="tiempo-filtro">
        <select
          value={proyectoFiltro}
          onChange={(e) => setProyectoFiltro(e.target.value)}
          className="tiempo-filtro-select"
        >
          <option value="">Todos los proyectos</option>
          {proyectosUnicos.map((p: any) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="tiempo-empty">
          <IconTimer />
          <h3>No hay registros de tiempo</h3>
          <p>Registrá tus horas para empezar a trackear tu trabajo.</p>
          <Link to="/tiempo/nuevo" className="btn-primary btn-icon" style={{ width: 'auto' }}>
            <IconPlus />
            Registrar horas
          </Link>
        </div>
      ) : (
        <div className="tiempo-lista">
          {filtrados.map((r, idx) => (
            <div key={r.id} className="tiempo-item" style={{ animationDelay: `${idx * 0.04}s` }}>
              <div className="tiempo-item-left">
                <div className="tiempo-item-top">
                  <span className="tiempo-item-horas">{Number(r.horas)}h</span>
                  {r.proyecto && (
                    <span className="tiempo-item-proyecto">{r.proyecto.nombre}</span>
                  )}
                  {r.tarea && (
                    <span className="tiempo-item-tarea">· {r.tarea.titulo}</span>
                  )}
                </div>
                {r.descripcion && (
                  <p className="tiempo-item-desc">{r.descripcion}</p>
                )}
              </div>
              <div className="tiempo-item-right">
                <span className="tiempo-item-fecha">{r.fecha}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
