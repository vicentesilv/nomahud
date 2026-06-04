import { useState, useEffect } from 'react';
import api from '../../services/api';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  fechaVencimiento: string | null;
  estimacionHoras: number | null;
  proyectoId: number;
  proyecto: { id: number; nombre: string };
  asignadoA: { id: number; nombre: string } | null;
  createdAt: string;
}

const PRIORIDAD_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baja: 3 };
const PRIORIDAD_LABEL: Record<string, string> = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' };
const PRIORIDAD_COLOR: Record<string, string> = { critica: '#ef4444', alta: '#f59e0b', media: '#06b6d4', baja: '#8888a0' };
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada', cancelada: 'Cancelada' };
const ESTADO_BADGE: Record<string, string> = { pendiente: 'badge-warning', en_progreso: 'badge-accent', completada: 'badge-success', cancelada: 'badge-error' };
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

function IconCheckSquare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function ListaTareas() {
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Tarea | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [vista, setVista] = useState<'tarjeta' | 'lista'>('tarjeta');

  useEffect(() => {
    api.get('/tareas')
      .then(({ data }) => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const taskDates = new Set(tasks.filter(t => t.fechaVencimiento).map(t => t.fechaVencimiento!.slice(0, 10)));

  const filteredTasks = selectedDate
    ? tasks.filter(t => t.fechaVencimiento && t.fechaVencimiento.slice(0, 10) === selectedDate)
    : tasks;

  const grouped = filteredTasks.reduce<Record<string, Tarea[]>>((acc, t) => {
    if (!acc[t.prioridad]) acc[t.prioridad] = [];
    acc[t.prioridad].push(t);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (PRIORIDAD_ORDER[a] ?? 99) - (PRIORIDAD_ORDER[b] ?? 99)
  );

  const calDays = getMonthDays(calYear, calMonth);
  const todayStr = new Date().toISOString().slice(0, 10);

  const navMonth = (dir: number) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
  };

  const handleDayClick = (d: Date) => {
    const s = d.toISOString().slice(0, 10);
    setSelectedDate(prev => prev === s ? null : s);
  };

  if (loading) {
    return (
      <div className="page-tareas">
        <div className="page-header"><h1>Tareas</h1></div>
        <div className="tareas-grid">
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
    <div className="page-tareas">
      <div className="page-header">
        <h1>Tareas</h1>
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
        </div>
      </div>

      <div className="tareas-layout">
        <div className="tareas-main">
          {selectedDate && (
            <div className="tareas-filter-bar">
              <span>
                <IconClock />
                Tareas con fecha: {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}
              </span>
              <button onClick={() => setSelectedDate(null)} className="btn-secondary" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>
                Limpiar filtro
              </button>
            </div>
          )}
          <div className="tareas-list-wrapper">
            {sortedGroups.length === 0 ? (
              <div className="tareas-empty">
                <IconCheckSquare />
                <p>{selectedDate ? 'No hay tareas para esta fecha.' : 'No hay tareas.'}</p>
              </div>
            ) : vista === 'tarjeta' ? (
              <div className="tareas-grid">
                {sortedGroups.map(([prioridad, tareas]) => (
                  <div key={prioridad} className="tareas-group">
                    <div className="tareas-group-header">
                      <span className="priority-dot-lg" style={{ background: PRIORIDAD_COLOR[prioridad] }} />
                      <span>{PRIORIDAD_LABEL[prioridad]}</span>
                      <span className="tareas-group-count">{tareas.length}</span>
                    </div>
                    <div className="tareas-card-grid">
                      {tareas.map((t, idx) => (
                        <div
                          key={t.id}
                          className="tarea-card prioridad-tarea-card"
                          style={{
                            animationDelay: `${idx * 0.03}s`,
                            borderLeftColor: PRIORIDAD_COLOR[t.prioridad],
                          }}
                          onClick={() => setSelectedTask(t)}
                        >
                          <div className="tarea-card-header">
                            <span className="tarea-card-titulo">{t.titulo}</span>
                            <span className={`badge ${ESTADO_BADGE[t.estado]}`}>{ESTADO_LABEL[t.estado]}</span>
                          </div>
                          <div className="tarea-card-meta">
                            <span><IconFolder /> {t.proyecto.nombre}</span>
                            {t.fechaVencimiento && (
                              <span><IconClock /> {new Date(t.fechaVencimiento).toLocaleDateString()}</span>
                            )}
                            {t.asignadoA && (
                              <span><IconUser /> {t.asignadoA.nombre}</span>
                            )}
                          </div>
                          {t.descripcion && (
                            <p className="tarea-card-desc">{t.descripcion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tareas-list">
                {sortedGroups.map(([prioridad, tareas]) => (
                  <div key={prioridad} className="tareas-group">
                    <div className="tareas-group-header">
                      <span className="priority-dot-lg" style={{ background: PRIORIDAD_COLOR[prioridad] }} />
                      <span>{PRIORIDAD_LABEL[prioridad]}</span>
                      <span className="tareas-group-count">{tareas.length}</span>
                    </div>
                    <div className="tareas-list-items">
                      {tareas.map((t, idx) => (
                        <div
                          key={t.id}
                          className="tarea-list-item"
                          style={{
                            animationDelay: `${idx * 0.02}s`,
                            borderLeftColor: PRIORIDAD_COLOR[t.prioridad],
                          }}
                          onClick={() => setSelectedTask(t)}
                        >
                          <div className="tarea-list-item-main">
                            <span className="tarea-list-item-titulo">{t.titulo}</span>
                            <div className="tarea-list-item-badges">
                              <span className={`badge ${ESTADO_BADGE[t.estado]}`}>{ESTADO_LABEL[t.estado]}</span>
                              <span className="tarea-list-item-proyecto">{t.proyecto.nombre}</span>
                            </div>
                          </div>
                          <div className="tarea-list-item-meta">
                            {t.fechaVencimiento && (
                              <span>{new Date(t.fechaVencimiento).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="tareas-sidebar">
          <div className="tareas-calendar">
            <div className="tareas-calendar-header">
              <button onClick={() => navMonth(-1)} className="btn-secondary" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>‹</button>
              <strong>{MONTHS[calMonth]} {calYear}</strong>
              <button onClick={() => navMonth(1)} className="btn-secondary" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>›</button>
            </div>
            <div className="tareas-calendar-grid">
              {DAYS.map(d => (
                <div key={d} className="tareas-calendar-day-header">{d}</div>
              ))}
              {calDays.map((day, i) => {
                const dateStr = day.toISOString().slice(0, 10);
                const isCurrent = day.getMonth() === calMonth;
                const hasTask = taskDates.has(dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={i}
                    className={`tareas-calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!isCurrent ? 'dimmed' : ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day.getDate()}
                    {hasTask && <span className="tareas-calendar-dot" />}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedTask ? (
            <div className="tarea-detalle">
              <h3 className="tarea-detalle-titulo">{selectedTask.titulo}</h3>
              <div className="tarea-detalle-info">
                <div className="tarea-detalle-row">
                  <span className="tarea-detalle-label">Estado</span>
                  <span className={`badge ${ESTADO_BADGE[selectedTask.estado]}`}>{ESTADO_LABEL[selectedTask.estado]}</span>
                </div>
                <div className="tarea-detalle-row">
                  <span className="tarea-detalle-label">Prioridad</span>
                  <span style={{ color: PRIORIDAD_COLOR[selectedTask.prioridad], fontWeight: 600 }}>{PRIORIDAD_LABEL[selectedTask.prioridad]}</span>
                </div>
                <div className="tarea-detalle-row">
                  <span className="tarea-detalle-label">Proyecto</span>
                  <span>{selectedTask.proyecto.nombre}</span>
                </div>
                {selectedTask.fechaVencimiento && (
                  <div className="tarea-detalle-row">
                    <span className="tarea-detalle-label">Vence</span>
                    <span>{new Date(selectedTask.fechaVencimiento).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedTask.estimacionHoras && (
                  <div className="tarea-detalle-row">
                    <span className="tarea-detalle-label">Horas estimadas</span>
                    <span>{selectedTask.estimacionHoras}h</span>
                  </div>
                )}
                {selectedTask.asignadoA && (
                  <div className="tarea-detalle-row">
                    <span className="tarea-detalle-label">Asignado a</span>
                    <span>{selectedTask.asignadoA.nombre}</span>
                  </div>
                )}
              </div>
              {selectedTask.descripcion && (
                <div className="tarea-detalle-desc">
                  <span className="tarea-detalle-label">Descripción</span>
                  <p>{selectedTask.descripcion}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="tareas-sidebar-empty">
              <IconCheckSquare />
              <p>Selecciona una tarea para ver detalles</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
