import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Tarea {
  id: number;
  titulo: string;
  estado: string;
  fechaVencimiento: string | null;
  proyecto: { nombre: string };
}

interface Viaje {
  id: number;
  destino: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: string;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const pad = (first.getDay() + 6) % 7;
  for (let i = pad; i > 0; i--) days.push(new Date(year, month, 1 - i));
  for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i));
  const rem = days.length % 7;
  for (let i = 1; i <= (7 - rem) % 7; i++) days.push(new Date(year, month + 1, i));
  return days;
}

function diaStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function extraerLista<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { datos?: unknown }).datos)) {
    return (data as { datos: T[] }).datos;
  }
  return [];
}

export default function Calendario() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [diaSel, setDiaSel] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get('/tareas'), api.get('/viajes')])
      .then(([{ data: t }, { data: v }]) => {
        setTareas(extraerLista<Tarea>(t));
        setViajes(extraerLista<Viaje>(v));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const tareasPorDia = new Map<string, Tarea[]>();
  for (const t of tareas) {
    if (!t.fechaVencimiento) continue;
    const d = t.fechaVencimiento.slice(0, 10);
    if (!tareasPorDia.has(d)) tareasPorDia.set(d, []);
    tareasPorDia.get(d)!.push(t);
  }

  const viajesPorDia = new Map<string, Viaje[]>();
  for (const v of viajes) {
    if (!v.fechaInicio) continue;
    const ini = v.fechaInicio.slice(0, 10);
    const fin = (v.fechaFin || v.fechaInicio).slice(0, 10);
    const d = new Date(ini + 'T12:00:00');
    const f = new Date(fin + 'T12:00:00');
    for (let x = new Date(d); x <= f; x.setDate(x.getDate() + 1)) {
      const k = diaStr(x);
      if (!viajesPorDia.has(k)) viajesPorDia.set(k, []);
      viajesPorDia.get(k)!.push(v);
    }
  }

  const dias = getMonthDays(anio, mes);
  const hoy = diaStr(new Date());

  const navMes = (dir: number) => {
    let m = mes + dir;
    let y = anio;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMes(m);
    setAnio(y);
  };

  const detalleTareas = diaSel ? tareasPorDia.get(diaSel) || [] : [];
  const detalleViajes = diaSel ? viajesPorDia.get(diaSel) || [] : [];

  return (
    <div className="page-tareas">
      <div className="page-header">
        <h1>Calendario</h1>
        <div className="page-header-actions">
          <button onClick={() => navMes(-1)} className="btn-secondary" style={{ width: 'auto' }}>‹</button>
          <strong>{MONTHS[mes]} {anio}</strong>
          <button onClick={() => navMes(1)} className="btn-secondary" style={{ width: 'auto' }}>›</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          <div className="tareas-calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {DAYS.map((d) => (
              <div key={d} className="tareas-calendar-day-header">{d}</div>
            ))}
            {dias.map((day, i) => {
              const k = diaStr(day);
              const nT = (tareasPorDia.get(k) || []).length;
              const nV = (viajesPorDia.get(k) || []).length;
              return (
                <div
                  key={i}
                  className={`tareas-calendar-day ${diaSel === k ? 'selected' : ''} ${k === hoy ? 'today' : ''} ${day.getMonth() !== mes ? 'dimmed' : ''}`}
                  onClick={() => setDiaSel((p) => (p === k ? null : k))}
                  style={{ minHeight: '64px', cursor: 'pointer' }}
                >
                  <div>{day.getDate()}</div>
                  {nT > 0 && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{nT} 📋</span>}
                  {nV > 0 && <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>{nV} ✈</span>}
                </div>
              );
            })}
          </div>

          {diaSel && (
            <div className="tareas-filter-bar" style={{ marginTop: '1rem' }}>
              <strong>{new Date(diaSel + 'T12:00:00').toLocaleDateString()}</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', width: '100%' }}>
                {detalleTareas.map((t) => (
                  <Link key={`t-${t.id}`} to="/tareas" style={{ color: 'var(--accent)' }}>
                    📋 {t.titulo} <em>({t.proyecto.nombre})</em>
                  </Link>
                ))}
                {detalleViajes.map((v) => (
                  <Link key={`v-${v.id}`} to={`/viajes/${v.id}`} style={{ color: 'var(--accent)' }}>
                    ✈ {v.destino}
                  </Link>
                ))}
                {detalleTareas.length === 0 && detalleViajes.length === 0 && <span>Nada programado.</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
