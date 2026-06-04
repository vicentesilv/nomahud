import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ItinerarioItem {
  id: number;
  lugar: string;
  fecha: string;
  descripcion: string;
  costo: number;
  orden: number;
}

interface Viaje {
  id: number;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  presupuesto: number;
  moneda: string;
  notas: string;
  creadorId: number;
  itinerario: ItinerarioItem[];
}

const estados: Record<string, { label: string; color: string }> = {
  planificado: { label: 'Planificado', color: 'var(--accent)' },
  en_curso: { label: 'En curso', color: '#22c55e' },
  completado: { label: 'Completado', color: '#6366f1' },
  cancelado: { label: 'Cancelado', color: '#ef4444' },
};

function safeDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
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

function IconMapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function DetalleViaje() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    destino: '', fechaInicio: '', fechaFin: '', estado: 'planificado',
    presupuesto: '', moneda: 'MXN', notas: '',
  });
  const [msg, setMsg] = useState('');
  const [itemError, setItemError] = useState('');
  const [itemForm, setItemForm] = useState({ lugar: '', fecha: '', descripcion: '', costo: '' });
  const [editItemId, setEditItemId] = useState<number | null>(null);

  const cargarViaje = () => {
    if (!id) return;
    api.get(`/viajes/${id}`).then(({ data }) => {
      setViaje(data);
      setForm({
        destino: data.destino || '',
        fechaInicio: data.fechaInicio || '',
        fechaFin: data.fechaFin || '',
        estado: data.estado || 'planificado',
        presupuesto: data.presupuesto != null ? String(data.presupuesto) : '',
        moneda: data.moneda || 'MXN',
        notas: data.notas || '',
      });
    }).catch(() => navigate('/viajes'));
  };

  useEffect(() => { cargarViaje(); }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (form.fechaFin && form.fechaInicio > form.fechaFin) {
      setMsg('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    try {
      const body: any = {};
      if (form.destino) body.destino = form.destino;
      if (form.fechaInicio) body.fechaInicio = safeDate(form.fechaInicio);
      if (form.fechaFin) body.fechaFin = safeDate(form.fechaFin);
      if (form.estado) body.estado = form.estado;
      if (form.presupuesto) body.presupuesto = Number(form.presupuesto);
      if (form.moneda !== 'MXN') body.moneda = form.moneda;
      if (form.notas) body.notas = form.notas;

      const { data } = await api.patch(`/viajes/${id}`, body);
      setViaje(data);
      setEditando(false);
      setMsg('Viaje actualizado correctamente');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Error al actualizar');
    }
  };

  const actualizarEstado = async (nuevoEstado: string) => {
    setMsg('');
    try {
      const { data } = await api.patch(`/viajes/${id}`, { estado: nuevoEstado });
      setViaje(data);
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const eliminar = async () => {
    if (!confirm('¿Eliminar este viaje?')) return;
    try {
      await api.delete(`/viajes/${id}`);
      navigate('/viajes');
    } catch {}
  };

  const agregarItem = async (e: FormEvent) => {
    e.preventDefault();
    setItemError('');
    if (!itemForm.lugar.trim()) return;
    try {
      const body: any = { lugar: itemForm.lugar };
      if (itemForm.fecha) body.fecha = safeDate(itemForm.fecha);
      if (itemForm.descripcion) body.descripcion = itemForm.descripcion;
      if (itemForm.costo) body.costo = Number(itemForm.costo);

      await api.post(`/viajes/${id}/itinerario`, body);
      setItemForm({ lugar: '', fecha: '', descripcion: '', costo: '' });
      cargarViaje();
    } catch (err: any) {
      setItemError(err.response?.data?.message || 'Error al agregar lugar');
    }
  };

  const eliminarItem = async (itemId: number) => {
    if (!confirm('¿Eliminar este lugar?')) return;
    try {
      await api.delete(`/viajes/${id}/itinerario/${itemId}`);
      cargarViaje();
    } catch {}
  };

  const guardarItemEdit = async (itemId: number) => {
    setItemError('');
    try {
      const body: any = {};
      if (itemForm.lugar) body.lugar = itemForm.lugar;
      if (itemForm.fecha) body.fecha = safeDate(itemForm.fecha);
      if (itemForm.descripcion !== undefined) body.descripcion = itemForm.descripcion;
      if (itemForm.costo) body.costo = Number(itemForm.costo);

      await api.patch(`/viajes/${id}/itinerario/${itemId}`, body);
      setEditItemId(null);
      setItemForm({ lugar: '', fecha: '', descripcion: '', costo: '' });
      cargarViaje();
    } catch (err: any) {
      setItemError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const iniciarEditItem = (item: ItinerarioItem) => {
    setEditItemId(item.id);
    setItemForm({
      lugar: item.lugar || '',
      fecha: item.fecha || '',
      descripcion: item.descripcion || '',
      costo: item.costo != null ? String(item.costo) : '',
    });
  };

  if (!viaje) return <div className="loading">Cargando viaje...</div>;

  const badge = estados[viaje.estado] || estados.planificado;

  return (
    <div className="page-viajes page-viaje-detalle">
      <div className="page-header">
        <button className="btn-icon-only" onClick={() => navigate('/viajes')} aria-label="Volver">
          <IconArrowLeft />
        </button>
        <h1>{viaje.destino}</h1>
        <div className="page-header-actions">
          {!editando && (
            <>
              <button onClick={() => setEditando(true)} className="btn-secondary btn-icon">
                <IconEdit />
                Editar
              </button>
              <button onClick={eliminar} className="btn-secondary btn-icon" style={{ color: 'var(--error)' }}>
                <IconTrash />
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {msg && <div className={msg.includes('Error') ? 'error-msg' : 'success-msg'}>{msg}</div>}

      {!editando ? (
        <div className="viaje-detalle-view">
          <div className="viaje-detalle-hero">
            <div className="viaje-detalle-icon">
              <IconMapPin />
            </div>
            <div className="viaje-detalle-hero-info">
              <span className="viaje-detalle-badge" style={{ borderColor: badge.color, color: badge.color }}>
                {badge.label}
              </span>
              <h2>{viaje.destino}</h2>
              <div className="viaje-detalle-hero-meta">
                <span><IconCalendar /> {viaje.fechaInicio}{viaje.fechaFin ? ` → ${viaje.fechaFin}` : ' (sin fecha de fin)'}</span>
                {viaje.presupuesto != null && (
                  <span><IconDollar /> {Number(viaje.presupuesto).toLocaleString('es-MX', { style: 'currency', currency: viaje.moneda || 'MXN' })}</span>
                )}
              </div>
            </div>
          </div>

          {viaje.notas && (
            <div className="viaje-detalle-section">
              <h3>Notas</h3>
              <p className="viaje-detalle-notas-texto">{viaje.notas}</p>
            </div>
          )}

          <div className="viaje-detalle-section">
            <h3>Itinerario</h3>

            {itemError && <div className="error-msg">{itemError}</div>}

            <form onSubmit={agregarItem} className="viaje-itinerario-form">
              <div className="field-row">
                <div className="field" style={{ flex: 2 }}>
                  <label>Lugar *</label>
                  <input
                    value={itemForm.lugar}
                    onChange={(e) => setItemForm({ ...itemForm, lugar: e.target.value })}
                    placeholder="Nombre del lugar o actividad"
                  />
                </div>
                <div className="field">
                  <label>Fecha</label>
                  <input type="date" value={itemForm.fecha} onChange={(e) => setItemForm({ ...itemForm, fecha: e.target.value })} />
                </div>
                <div className="field">
                  <label>Costo</label>
                  <input type="number" step="0.01" min="0" value={itemForm.costo} onChange={(e) => setItemForm({ ...itemForm, costo: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="field">
                <label>Descripción</label>
                <input value={itemForm.descripcion} onChange={(e) => setItemForm({ ...itemForm, descripcion: e.target.value })} placeholder="Dirección, horario, notas..." />
              </div>
              <div>
                {editItemId ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => guardarItemEdit(editItemId)} className="btn-primary" style={{ width: 'auto' }}>Guardar</button>
                    <button type="button" onClick={() => { setEditItemId(null); setItemForm({ lugar: '', fecha: '', descripcion: '', costo: '' }); }} className="btn-secondary" style={{ width: 'auto' }}>Cancelar</button>
                  </div>
                ) : (
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }}><IconPlus /> Agregar lugar</button>
                )}
              </div>
            </form>

            {(!viaje.itinerario || viaje.itinerario.length === 0) ? (
              <p className="viaje-itinerario-vacio">Aún no hay lugares planificados.</p>
            ) : (
              <div className="viaje-itinerario-lista">
                {viaje.itinerario.map((item, idx) => (
                  <div key={item.id} className="viaje-itinerario-item">
                    <div className="viaje-itinerario-item-num">#{idx + 1}</div>
                    <div className="viaje-itinerario-item-content">
                      <div className="viaje-itinerario-item-header">
                        <strong>{item.lugar}</strong>
                        <div className="viaje-itinerario-item-actions">
                          <button onClick={() => iniciarEditItem(item)} className="btn-icon-only-sm" title="Editar">
                            <IconEdit />
                          </button>
                          <button onClick={() => eliminarItem(item.id)} className="btn-icon-only-sm" title="Eliminar" style={{ color: 'var(--error)' }}>
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                      {item.fecha && <span className="viaje-itinerario-item-meta"><IconCalendar /> {item.fecha}</span>}
                      {item.descripcion && <p className="viaje-itinerario-item-desc">{item.descripcion}</p>}
                      {item.costo != null && (
                        <span className="viaje-itinerario-item-costo"><IconDollar /> {Number(item.costo).toLocaleString('es-MX', { style: 'currency', currency: viaje.moneda || 'MXN' })}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="viaje-detalle-section">
            <h3>Cambiar estado</h3>
            <div className="viaje-estado-btns">
              {Object.entries(estados).map(([key, b]) => (
                <button
                  key={key}
                  onClick={() => actualizarEstado(key)}
                  disabled={viaje.estado === key}
                  className={`viaje-estado-btn ${viaje.estado === key ? 'active' : ''}`}
                  style={{
                    '--btn-color': b.color,
                  } as React.CSSProperties}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="perfil-form viajes-form">
          <div className="field">
            <label>Destino *</label>
            <input name="destino" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} required />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Fecha de inicio</label>
              <input name="fechaInicio" type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
            </div>
            <div className="field">
              <label>Fecha de fin</label>
              <input name="fechaFin" type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} min={form.fechaInicio || undefined} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Presupuesto</label>
              <input name="presupuesto" type="number" step="0.01" min="0" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })} />
            </div>
            <div className="field">
              <label>Moneda</label>
              <select name="moneda" value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="COP">COP</option>
                <option value="ARS">ARS</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Estado</label>
            <select name="estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="planificado">Planificado</option>
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="field">
            <label>Notas</label>
            <textarea name="notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={3} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar cambios</button>
            <button type="button" onClick={() => setEditando(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
