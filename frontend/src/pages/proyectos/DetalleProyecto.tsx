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
  activo: 'Activo',
  completado: 'Completado',
  en_pausa: 'En pausa',
  cancelado: 'Cancelado',
};

const PRIORIDADES: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

const COLUMNAS = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_progreso', label: 'En progreso' },
  { key: 'completada', label: 'Completada' },
];

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

  return (
    <div className="page-perfil" style={{ maxWidth: '100%' }}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ margin: 0 }}>{proyecto.nombre}</h1>
            <span className={`badge badge-${proyecto.estado === 'activo' ? 'success' : proyecto.estado === 'completado' ? 'success' : proyecto.estado === 'en_pausa' ? 'warning' : 'error'}`}>
              {ESTADOS_PROYECTO[proyecto.estado] || proyecto.estado}
            </span>
            <span className="badge badge-warning" style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--primary)', border: '1px solid rgba(124,58,237,0.2)' }}>
              {PRIORIDADES[proyecto.prioridad] || proyecto.prioridad}
            </span>
          </div>
          {proyecto.clienteRel && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Cliente: {proyecto.clienteRel.nombre}{proyecto.clienteRel.empresa ? ` (${proyecto.clienteRel.empresa})` : ''}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={abrirEditarProyecto} className="btn-secondary" style={{ width: 'auto' }}>
            ✎ Editar proyecto
          </button>
          <button onClick={abrirFormNueva} className="btn-primary" style={{ width: 'auto' }}>
            + Nueva tarea
          </button>
          <button onClick={() => navigate('/proyectos')} className="btn-secondary">Volver</button>
          <button onClick={eliminarProyecto} className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>
            ✕ Eliminar
          </button>
        </div>
      </div>

      {/* Project info */}
      <div className="perfil-section" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          {proyecto.descripcion && (
            <div style={{ flex: '1 1 100%' }}>
              <strong style={{ color: 'var(--text-muted)' }}>Descripción:</strong>
              <p style={{ marginTop: '0.25rem' }}>{proyecto.descripcion}</p>
            </div>
          )}
          {proyecto.fechaInicio && (
            <div><strong style={{ color: 'var(--text-muted)' }}>Inicio:</strong> {proyecto.fechaInicio}</div>
          )}
          {proyecto.fechaFin && (
            <div><strong style={{ color: 'var(--text-muted)' }}>Fin:</strong> {proyecto.fechaFin}</div>
          )}
          {proyecto.ganancia != null && (
            <div><strong style={{ color: 'var(--text-muted)' }}>Ganancia:</strong> ${Number(proyecto.ganancia).toLocaleString()}</div>
          )}
          <div><strong style={{ color: 'var(--text-muted)' }}>Tareas:</strong> {tareas.length} ({tareas.filter(t => t.estado !== 'completada' && t.estado !== 'cancelada').length} pendientes)</div>
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {COLUMNAS.map((col) => (
          <div key={col.key} className="perfil-section" style={{ padding: '1rem', minHeight: '120px' }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {col.label}
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-dim)', fontWeight: 400 }}>({tareasPorColumna(col.key).length})</span>
            </h3>
            {tareasPorColumna(col.key).length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>
                Sin tareas
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tareasPorColumna(col.key).map((t) => (
                  <div
                    key={t.id}
                    className="perfil-section"
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      border: `1px solid ${t.prioridad === 'critica' ? 'rgba(239,68,68,0.3)' : t.prioridad === 'alta' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                    }}
                    onClick={() => abrirFormEditar(t)}
                  >
                    <div style={{ fontWeight: 500, fontSize: '0.85rem', marginBottom: '0.3rem' }}>{t.titulo}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span className={`badge badge-${t.prioridad === 'critica' || t.prioridad === 'alta' ? 'error' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                        {PRIORIDADES[t.prioridad] || t.prioridad}
                      </span>
                      {t.estimacionHoras && <span style={{ color: 'var(--text-dim)' }}>{t.estimacionHoras}h</span>}
                    </div>
                    {/* Move buttons */}
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem' }}>
                      {col.key === 'pendiente' && (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                          onClick={(e) => { e.stopPropagation(); cambiarEstadoTarea(t, 'en_progreso'); }}
                        >
                          → Iniciar
                        </button>
                      )}
                      {col.key === 'en_progreso' && (
                        <>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                            onClick={(e) => { e.stopPropagation(); cambiarEstadoTarea(t, 'completada'); }}
                          >
                            ✓ Completar
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                            onClick={(e) => { e.stopPropagation(); cambiarEstadoTarea(t, 'pendiente'); }}
                          >
                            ← Volver
                          </button>
                        </>
                      )}
                      {col.key === 'completada' && (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                          onClick={(e) => { e.stopPropagation(); cambiarEstadoTarea(t, 'en_progreso'); }}
                        >
                          ← Reabrir
                        </button>
                      )}
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
                        onClick={(e) => { e.stopPropagation(); eliminarTarea(t.id); }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task form modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowForm(false)}>
          <div className="perfil-form" style={{ maxWidth: '480px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.25rem' }}>
              {editandoTarea ? 'Editar tarea' : 'Nueva tarea'}
            </h3>
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
                  <select value={tareaForm.prioridad} onChange={(e) => setTareaForm({ ...tareaForm, prioridad: e.target.value })}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
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
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editandoTarea ? 'Guardar cambios' : 'Crear tarea'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project edit modal */}
      {showProyectoForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowProyectoForm(false)}>
          <div className="perfil-form" style={{ maxWidth: '400px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.25rem' }}>Editar proyecto</h3>
            <form onSubmit={guardarProyecto}>
              <div className="field">
                <label>Estado</label>
                <select value={proyectoForm.estado} onChange={(e) => setProyectoForm({ ...proyectoForm, estado: e.target.value })}>
                  <option value="activo">Activo</option>
                  <option value="en_pausa">En pausa</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="field">
                <label>Ganancia (USD)</label>
                <input type="number" value={proyectoForm.ganancia} onChange={(e) => setProyectoForm({ ...proyectoForm, ganancia: e.target.value })} placeholder="5000" />
              </div>
              {proyecto?.estado !== 'completado' && proyectoForm.estado === 'completado' && proyectoForm.ganancia && (
                <div className="success-msg" style={{ fontSize: '0.8rem' }}>
                  Al marcar como completado se creará automáticamente un ingreso en Finanzas por ${Number(proyectoForm.ganancia).toLocaleString()}
                </div>
              )}
              <div className="form-actions">
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
