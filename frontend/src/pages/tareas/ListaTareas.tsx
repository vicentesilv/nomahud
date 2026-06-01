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

export default function ListaTareas() {
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Tarea | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

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

  if (loading) return <div className="loading">Cargando tareas...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Tareas</h1>
        {selectedDate && (
          <button onClick={() => setSelectedDate(null)} className="btn-secondary" style={{ width: 'auto', fontSize: '0.85rem' }}>
            Limpiar filtro
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedDate && (
            <p style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Tareas con fecha: {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}
            </p>
          )}
          {sortedGroups.length === 0 ? (
            <div className="perfil-section" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>{selectedDate ? 'No hay tareas para esta fecha.' : 'No hay tareas.'}</p>
            </div>
          ) : (
            sortedGroups.map(([prioridad, tareas]) => (
              <div key={prioridad} className="perfil-section" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: PRIORIDAD_COLOR[prioridad] }} />
                  <strong style={{ fontSize: '0.9rem' }}>{PRIORIDAD_LABEL[prioridad]}</strong>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>({tareas.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {tareas.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        background: selectedTask?.id === t.id ? 'var(--bg-card-hover)' : 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>{t.titulo}</strong>
                          <span style={{
                            fontSize: '0.7rem', marginLeft: '0.5rem',
                            padding: '0.1rem 0.35rem', borderRadius: '4px',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                          }}>
                            {ESTADO_LABEL[t.estado]}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t.proyecto.nombre}</span>
                      </div>
                      {t.fechaVencimiento && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                          {new Date(t.fechaVencimiento).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedTask ? (
            <div className="perfil-section" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{selectedTask.titulo}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Estado: </span>{ESTADO_LABEL[selectedTask.estado]}</div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Prioridad: </span>
                  <span style={{ color: PRIORIDAD_COLOR[selectedTask.prioridad] }}>{PRIORIDAD_LABEL[selectedTask.prioridad]}</span>
                </div>
                <div><span style={{ color: 'var(--text-muted)' }}>Proyecto: </span>{selectedTask.proyecto.nombre}</div>
                {selectedTask.fechaVencimiento && (
                  <div><span style={{ color: 'var(--text-muted)' }}>Vence: </span>{new Date(selectedTask.fechaVencimiento).toLocaleDateString()}</div>
                )}
                {selectedTask.estimacionHoras && (
                  <div><span style={{ color: 'var(--text-muted)' }}>Horas estimadas: </span>{selectedTask.estimacionHoras}h</div>
                )}
                {selectedTask.asignadoA && (
                  <div><span style={{ color: 'var(--text-muted)' }}>Asignado a: </span>{selectedTask.asignadoA.nombre}</div>
                )}
                {selectedTask.descripcion && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Descripción: </span>
                    <p style={{ marginTop: '0.25rem', color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{selectedTask.descripcion}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="perfil-section" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Selecciona una tarea para ver detalles</p>
            </div>
          )}

          <div className="perfil-section" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button onClick={() => navMonth(-1)} className="btn-secondary" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>‹</button>
              <strong style={{ fontSize: '0.9rem' }}>{MONTHS[calMonth]} {calYear}</strong>
              <button onClick={() => navMonth(1)} className="btn-secondary" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
              {DAYS.map(d => (
                <div key={d} style={{ fontSize: '0.7rem', color: 'var(--text-dim)', padding: '0.3rem 0' }}>{d}</div>
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
                    onClick={() => handleDayClick(day)}
                    style={{
                      padding: '0.35rem 0', fontSize: '0.8rem', cursor: 'pointer',
                      borderRadius: '4px', position: 'relative',
                      background: isSelected ? 'var(--accent)' : isToday ? 'var(--bg-card-hover)' : 'transparent',
                      color: isSelected ? '#fff' : isCurrent ? 'var(--text)' : 'var(--text-dim)',
                      opacity: isCurrent ? 1 : 0.35,
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'var(--bg-card-hover)' : 'transparent'; }}
                  >
                    {day.getDate()}
                    {hasTask && (
                      <span style={{
                        position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                        width: '4px', height: '4px', borderRadius: '50%',
                        background: isSelected ? '#fff' : PRIORIDAD_COLOR.critica,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
