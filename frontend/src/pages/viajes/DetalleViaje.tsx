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

const badges: Record<string, { label: string; color: string }> = {
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

  const badge = badges[viaje.estado] || badges.planificado;

  return (
    <div className="page-perfil">
      <div className="page-header">
        <h1>{viaje.destino}</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!editando && (
            <>
              <button onClick={() => setEditando(true)} className="btn-secondary">✎ Editar</button>
              <button onClick={eliminar} className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>✕ Eliminar</button>
            </>
          )}
          <button onClick={() => navigate('/viajes')} className="btn-secondary">Volver</button>
        </div>
      </div>

      {msg && <div className={msg.includes('Error') ? 'error-msg' : 'success-msg'}>{msg}</div>}

      {!editando ? (
        <div className="perfil-view">
          <div className="perfil-section">
            <h3>✦ Información</h3>
            <p>
              <strong>Estado:</strong>{' '}
              <span style={{
                fontSize: '0.8rem', padding: '0.15rem 0.6rem', borderRadius: '999px',
                border: `1px solid ${badge.color}`, color: badge.color,
              }}>
                {badge.label}
              </span>
            </p>
            <p><strong>Destino:</strong> {viaje.destino}</p>
            <p><strong>Fechas:</strong> {viaje.fechaInicio}{viaje.fechaFin ? ` → ${viaje.fechaFin}` : ' (sin fecha de fin)'}</p>
            {viaje.presupuesto != null && (
              <p><strong>Presupuesto:</strong> {Number(viaje.presupuesto).toLocaleString('es-MX', { style: 'currency', currency: viaje.moneda || 'MXN' })}</p>
            )}
            {viaje.presupuesto == null && (
              <p><strong>Presupuesto:</strong> Sin presupuesto</p>
            )}
          </div>

          {viaje.notas && (
            <div className="perfil-section">
              <h3>◈ Notas</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{viaje.notas}</p>
            </div>
          )}

          <div className="perfil-section">
            <h3>◈ Itinerario</h3>

            {itemError && <div className="error-msg">{itemError}</div>}

            <form onSubmit={agregarItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
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
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }}>+ Agregar lugar</button>
                )}
              </div>
            </form>

            {(!viaje.itinerario || viaje.itinerario.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no hay lugares planificados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {viaje.itinerario.map((item, idx) => (
                  <div key={item.id} style={{
                    padding: '0.75rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>#{idx + 1}</span>
                          <strong>{item.lugar}</strong>
                        </div>
                        {item.fecha && <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>📅 {item.fecha}</div>}
                        {item.descripcion && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.descripcion}</div>}
                        {item.costo != null && (
                          <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.2rem' }}>
                            💰 {Number(item.costo).toLocaleString('es-MX', { style: 'currency', currency: viaje.moneda || 'MXN' })}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => iniciarEditItem(item)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}>✎</button>
                        <button onClick={() => eliminarItem(item.id)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto', color: 'var(--error)' }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="perfil-section">
            <h3>◈ Cambiar estado</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(badges).map(([key, b]) => (
                <button
                  key={key}
                  onClick={() => actualizarEstado(key)}
                  disabled={viaje.estado === key}
                  style={{
                    padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '999px',
                    border: `1px solid ${key === viaje.estado ? b.color : 'rgba(255,255,255,0.1)'}`,
                    background: key === viaje.estado ? `${b.color}22` : 'transparent',
                    color: key === viaje.estado ? b.color : 'var(--text-dim)',
                    cursor: key === viaje.estado ? 'default' : 'pointer',
                    opacity: key === viaje.estado ? 0.7 : 1,
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="perfil-form">
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
