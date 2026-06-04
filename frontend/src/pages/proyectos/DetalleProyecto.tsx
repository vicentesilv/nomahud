import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fechaVencimiento: string;
  estimacionHoras: number;
  proyectoId: number;
  asignadoA: { id: number; nombre: string } | null;
  createdAt: string;
}

interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  cliente: string;
  clienteRel: { id: number; nombre: string; empresa: string } | null;
  ganancia: number;
  fechaInicio: string;
  fechaFin: string;
  tareas: Tarea[];
  createdAt: string;
}

const ESTADOS_PROYECTO: Record<string, string> = {
  activo: 'Activo', completado: 'Completado', en_pausa: 'En pausa', cancelado: 'Cancelado',
};

const PRIORIDADES: Record<string, string> = {
  baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica',
};

const COLUMNAS = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_progreso', label: 'En progreso' },
  { key: 'completada', label: 'Completada' },
];

function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
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

function IconEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function DetalleProyecto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editandoTarea, setEditandoTarea] = useState<Tarea | null>(null);
  const [tareaForm, setTareaForm] = useState({ titulo: '', descripcion: '', prioridad: 'media', fechaVencimiento: '', estimacionHoras: '' });
  const [tareaError, setTareaError] = useState('');
  const [showProyectoForm, setShowProyectoForm] = useState(false);
  const [proyectoForm, setProyectoForm] = useState({ ganancia: '', estado: '' });

  const cargarProyecto = () => {
    if (!id) return;
    api.get(`/proyectos/${id}`).then(({ data }) => {
      setProyecto(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { cargarProyecto(); }, [id]);

  const abrirFormNueva = () => {
    setEditandoTarea(null);
    setTareaForm({ titulo: '', descripcion: '', prioridad: 'media', fechaVencimiento: '', estimacionHoras: '' });
    setTareaError('');
    setShowForm(true);
  };

  const abrirFormEditar = (t: Tarea) => {
    setEditandoTarea(t);
    setTareaForm({
      titulo: t.titulo,
      descripcion: t.descripcion || '',
      prioridad: t.prioridad,
      fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.slice(0, 16) : '',
      estimacionHoras: t.estimacionHoras ? String(t.estimacionHoras) : '',
    });
    setTareaError('');
    setShowForm(true);
  };

  const handleTareaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTareaError('');

    if (!tareaForm.titulo.trim()) {
      setTareaError('El título es obligatorio');
      return;
    }

    try {
      const body: any = { titulo: tareaForm.titulo, prioridad: tareaForm.prioridad };
      if (tareaForm.descripcion) body.descripcion = tareaForm.descripcion;
      if (tareaForm.fechaVencimiento) body.fechaVencimiento = new Date(tareaForm.fechaVencimiento).toISOString();
      if (tareaForm.estimacionHoras) body.estimacionHoras = Number(tareaForm.estimacionHoras);

      if (editandoTarea) {
        await api.patch(`/tareas/${editandoTarea.id}`, body);
      } else {
        await api.post('/tareas', { ...body, proyectoId: Number(id) });
      }

      setShowForm(false);
      setEditandoTarea(null);
      cargarProyecto();
    } catch (err: any) {
      setTareaError(err.response?.data?.message || 'Error al guardar la tarea');
    }
  };

  const cambiarEstadoTarea = async (tarea: Tarea, nuevoEstado: string) => {
    try {
      await api.patch(`/tareas/${tarea.id}`, { estado: nuevoEstado });
      cargarProyecto();
    } catch {}
  };

  const eliminarTarea = async (tareaId: number) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.delete(`/tareas/${tareaId}`);
      cargarProyecto();
    } catch {}
  };

  const eliminarProyecto = async () => {
    if (!confirm('¿Eliminar este proyecto? Se eliminarán todas sus tareas.')) return;
    try {
      await api.delete(`/proyectos/${id}`);
      navigate('/proyectos');
    } catch {}
  };

  const abrirEditarProyecto = () => {
    setProyectoForm({
      ganancia: proyecto?.ganancia ? String(proyecto.ganancia) : '',
      estado: proyecto?.estado || 'activo',
    });
    setShowProyectoForm(true);
  };

  const guardarProyecto = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body: any = { estado: proyectoForm.estado };
      if (proyectoForm.ganancia) body.ganancia = Number(proyectoForm.ganancia);
      await api.patch(`/proyectos/${id}`, body);
      setShowProyectoForm(false);
      cargarProyecto();
    } catch {}
  };

  if (loading) return <div className="loading">Cargando proyecto...</div>;
  if (!proyecto) return <div className="loading">Proyecto no encontrado</div>;

  const tareas = proyecto.tareas || [];
  const tareasPorColumna = (estado: string) => tareas.filter((t) => t.estado === estado);
  const badgeEstado = proyecto.estado === 'activo' || proyecto.estado === 'completado' ? 'badge-success' : proyecto.estado === 'en_pausa' ? 'badge-warning' : 'badge-error';

  return (
    <div className="proyecto-detalle">
      <div className="proyecto-header">
        <div className="proyecto-header-left">
          <h1 className="proyecto-header-titulo">
            {proyecto.nombre}
            <span className={`badge ${badgeEstado}`}>{ESTADOS_PROYECTO[proyecto.estado] || proyecto.estado}</span>
            <span className="badge-prioridad" style={{
              background: `${proyecto.prioridad === 'critica' ? '#ef4444' : proyecto.prioridad === 'alta' ? '#f59e0b' : proyecto.prioridad === 'media' ? '#06b6d4' : '#8888a0'}1a`,
              color: proyecto.prioridad === 'critica' ? '#ef4444' : proyecto.prioridad === 'alta' ? '#f59e0b' : proyecto.prioridad === 'media' ? '#06b6d4' : '#8888a0',
              borderColor: `${proyecto.prioridad === 'critica' ? '#ef4444' : proyecto.prioridad === 'alta' ? '#f59e0b' : proyecto.prioridad === 'media' ? '#06b6d4' : '#8888a0'}40`,
            }}>
              {PRIORIDADES[proyecto.prioridad] || proyecto.prioridad}
            </span>
          </h1>
          {proyecto.clienteRel && (
            <p className="proyecto-header-cliente">
              Cliente: {proyecto.clienteRel.nombre}{proyecto.clienteRel.empresa ? ` (${proyecto.clienteRel.empresa})` : ''}
            </p>
          )}
        </div>
        <div className="proyecto-header-actions">
          <button onClick={abrirEditarProyecto} className="btn-secondary btn-icon">
            <IconEdit />
            Editar
          </button>
          <button onClick={abrirFormNueva} className="btn-primary btn-icon">
            <IconPlus />
            Nueva tarea
          </button>
          <button onClick={() => navigate('/proyectos')} className="btn-secondary btn-icon">
            <IconArrowLeft />
            Volver
          </button>
          <button onClick={eliminarProyecto} className="btn-secondary btn-icon" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <IconTrash />
            Eliminar
          </button>
        </div>
      </div>

      <div className="proyecto-info-card">
        {proyecto.descripcion && (
          <div className="proyecto-info-desc">
            <span className="proyecto-info-label">Descripción</span>
            <p>{proyecto.descripcion}</p>
          </div>
        )}
        {proyecto.fechaInicio && (
          <div className="proyecto-info-item">
            <span className="proyecto-info-label">Inicio</span>
            <span className="proyecto-info-value">{new Date(proyecto.fechaInicio).toLocaleDateString()}</span>
          </div>
        )}
        {proyecto.fechaFin && (
          <div className="proyecto-info-item">
            <span className="proyecto-info-label">Fin</span>
            <span className="proyecto-info-value">{new Date(proyecto.fechaFin).toLocaleDateString()}</span>
          </div>
        )}
        {proyecto.ganancia != null && (
          <div className="proyecto-info-item">
            <span className="proyecto-info-label">Ganancia</span>
            <span className="proyecto-info-value">${Number(proyecto.ganancia).toLocaleString()}</span>
          </div>
        )}
        <div className="proyecto-info-item">
          <span className="proyecto-info-label">Tareas</span>
          <span className="proyecto-info-value">{tareas.length} ({tareas.filter(t => t.estado !== 'completada').length} pendientes)</span>
        </div>
      </div>

      <div className="kanban-grid">
        {COLUMNAS.map((col) => {
          const colTareas = tareasPorColumna(col.key);
          return (
            <div key={col.key} className="kanban-columna">
              <div className="kanban-columna-header">
                <span className="kanban-columna-titulo">{col.label}</span>
                <span className="kanban-columna-count">{colTareas.length}</span>
              </div>
              {colTareas.length === 0 ? (
                <p className="kanban-columna-empty">Sin tareas</p>
              ) : (
                colTareas.map((t) => (
                  <div key={t.id} className={`kanban-tarea kanban-tarea-prioridad ${t.prioridad}`} onClick={() => abrirFormEditar(t)}>
                    <div className="kanban-tarea-titulo">{t.titulo}</div>
                    <div className="kanban-tarea-meta">
                      <span className="badge-prioridad" style={{
                        background: `${t.prioridad === 'critica' ? '#ef4444' : t.prioridad === 'alta' ? '#f59e0b' : t.prioridad === 'media' ? '#06b6d4' : '#8888a0'}1a`,
                        color: t.prioridad === 'critica' ? '#ef4444' : t.prioridad === 'alta' ? '#f59e0b' : t.prioridad === 'media' ? '#06b6d4' : '#8888a0',
                        borderColor: `${t.prioridad === 'critica' ? '#ef4444' : t.prioridad === 'alta' ? '#f59e0b' : t.prioridad === 'media' ? '#06b6d4' : '#8888a0'}40`,
                        padding: '0.1rem 0.4rem', fontSize: '0.65rem',
                      }}>
                        {PRIORIDADES[t.prioridad] || t.prioridad}
                      </span>
                      {t.estimacionHoras ? <span>{t.estimacionHoras}h</span> : null}
                    </div>
                    <div className="kanban-tarea-actions">
                      {col.key === 'pendiente' && (
                        <button className="kanban-tarea-btn" onClick={(e) => { e.stopPropagation(); cambiarEstadoTarea(t, 'en_progreso'); }}>
                          → Iniciar
                        </button>
                      )}
                      {col.key === 'en_progreso' && (
                        <>
                          <button className="kanban-tarea-btn" onClick={(e) => { e.stopPropagation(); cambiarEstadoTarea(t, 'completada'); }}>
                            ✓ Completar
                          </button>
                          <button className="kanban-tarea-btn" onClick={(e) => { e.stopPropagation(); cambiarEstadoTarea(t, 'pendiente'); }}>
                            ← Volver
                          </button>
                        </>
                      )}
                      {col.key === 'completada' && (
                        <button className="kanban-tarea-btn" onClick={(e) => { e.stopPropagation(); cambiarEstadoTarea(t, 'en_progreso'); }}>
                          ← Reabrir
                        </button>
                      )}
                      <button className="kanban-tarea-btn kanban-tarea-btn-danger" onClick={(e) => { e.stopPropagation(); eliminarTarea(t.id); }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editandoTarea ? 'Editar tarea' : 'Nueva tarea'}</h3>
            <form onSubmit={handleTareaSubmit}>
              {tareaError && <div className="error-msg">{tareaError}</div>}
              <div className="field">
                <label>Título *</label>
                <input value={tareaForm.titulo} onChange={(e) => setTareaForm({ ...tareaForm, titulo: e.target.value })} required placeholder="¿Qué hay que hacer?" />
              </div>
              <div className="field">
                <label>Descripción</label>
                <textarea value={tareaForm.descripcion} onChange={(e) => setTareaForm({ ...tareaForm, descripcion: e.target.value })} rows={2} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Prioridad</label>
                  <div className="select-wrapper">
                    <select value={tareaForm.prioridad} onChange={(e) => setTareaForm({ ...tareaForm, prioridad: e.target.value })}>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Estimación (horas)</label>
                  <input type="number" value={tareaForm.estimacionHoras} onChange={(e) => setTareaForm({ ...tareaForm, estimacionHoras: e.target.value })} placeholder="4" />
                </div>
              </div>
              <div className="field">
                <label>Fecha de vencimiento</label>
                <input type="datetime-local" value={tareaForm.fechaVencimiento} onChange={(e) => setTareaForm({ ...tareaForm, fechaVencimiento: e.target.value })} />
              </div>
              <div className="form-actions" style={{ marginTop: '1.25rem' }}>
                <button type="submit" className="btn-primary">
                  {editandoTarea ? 'Guardar cambios' : 'Crear tarea'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProyectoForm && (
        <div className="modal-overlay" onClick={() => setShowProyectoForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Editar proyecto</h3>
            <form onSubmit={guardarProyecto}>
              <div className="field">
                <label>Estado</label>
                <div className="select-wrapper">
                  <select value={proyectoForm.estado} onChange={(e) => setProyectoForm({ ...proyectoForm, estado: e.target.value })}>
                    <option value="activo">Activo</option>
                    <option value="en_pausa">En pausa</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Ganancia (USD)</label>
                <input type="number" value={proyectoForm.ganancia} onChange={(e) => setProyectoForm({ ...proyectoForm, ganancia: e.target.value })} placeholder="5000" />
              </div>
              {[proyecto?.estado, proyectoForm.estado].includes('completado') && proyectoForm.ganancia && proyecto?.estado !== 'completado' && (
                <div className="success-msg" style={{ fontSize: '0.8rem' }}>
                  Al marcar como completado se creará un ingreso en Finanzas por ${Number(proyectoForm.ganancia).toLocaleString()}
                </div>
              )}
              <div className="form-actions" style={{ marginTop: '1.25rem' }}>
                <button type="submit" className="btn-primary">Guardar cambios</button>
                <button type="button" onClick={() => setShowProyectoForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
