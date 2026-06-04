import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function initiales(nombre: string) {
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function DetalleCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: '', empresa: '', correo: '', telefono: '', sitioWeb: '', notas: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/clientes/${id}`).then(({ data }) => {
      setCliente(data);
      setForm({
        nombre: data.nombre || '',
        empresa: data.empresa || '',
        correo: data.correo || '',
        telefono: data.telefono || '',
        sitioWeb: data.sitioWeb || '',
        notas: data.notas || '',
      });
    }).catch(() => navigate('/clientes'));
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const body: any = {};
      if (form.nombre) body.nombre = form.nombre;
      if (form.empresa) body.empresa = form.empresa;
      if (form.correo) body.correo = form.correo;
      if (form.telefono) body.telefono = form.telefono;
      if (form.sitioWeb) body.sitioWeb = form.sitioWeb;
      if (form.notas) body.notas = form.notas;

      const { data } = await api.patch(`/clientes/${id}`, body);
      setCliente(data);
      setEditando(false);
      setMsg('Cliente actualizado correctamente');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Error al actualizar');
    }
  };

  const eliminar = async () => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      navigate('/clientes');
    } catch {}
  };

  if (!cliente) return <div className="loading">Cargando cliente...</div>;

  const colorIdx = cliente.id % COLORS.length;

  return (
    <div className="page-clientes">
      <div className="page-header">
        <div className="page-header-left">
          <div className="cliente-detalle-avatar" style={{ background: COLORS[colorIdx] }}>
            {initiales(cliente.nombre)}
          </div>
          <div>
            <h1>{cliente.nombre}</h1>
            {cliente.empresa && <p className="cliente-detalle-empresa">{cliente.empresa}</p>}
          </div>
        </div>
        <div className="page-header-actions">
          {!editando && (
            <>
              <button onClick={() => setEditando(true)} className="btn-secondary btn-icon">
                <IconEdit />
                Editar
              </button>
              <button onClick={eliminar} className="btn-secondary btn-icon" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <IconTrash />
                Eliminar
              </button>
            </>
          )}
          <button onClick={() => navigate('/clientes')} className="btn-secondary btn-icon">
            <IconArrowLeft />
            Volver
          </button>
        </div>
      </div>

      {msg && <div className={msg.includes('Error') ? 'error-msg' : 'success-msg'}>{msg}</div>}

      {!editando ? (
        <div className="cliente-detalle-card">
          <div className="cliente-detalle-grid">
            {cliente.correo && (
              <div className="cliente-detalle-item">
                <IconMail />
                <div>
                  <span className="cliente-detalle-label">Correo</span>
                  <span className="cliente-detalle-value">{cliente.correo}</span>
                </div>
              </div>
            )}
            {cliente.telefono && (
              <div className="cliente-detalle-item">
                <IconPhone />
                <div>
                  <span className="cliente-detalle-label">Teléfono</span>
                  <span className="cliente-detalle-value">{cliente.telefono}</span>
                </div>
              </div>
            )}
            {cliente.sitioWeb && (
              <div className="cliente-detalle-item">
                <IconGlobe />
                <div>
                  <span className="cliente-detalle-label">Sitio web</span>
                  <a href={cliente.sitioWeb} target="_blank" rel="noopener noreferrer" className="cliente-detalle-value cliente-detalle-link">
                    {cliente.sitioWeb}
                  </a>
                </div>
              </div>
            )}
            <div className="cliente-detalle-item">
              <IconUsers />
              <div>
                <span className="cliente-detalle-label">Cliente desde</span>
                <span className="cliente-detalle-value">
                  {new Date(cliente.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          {cliente.notas && (
            <div className="cliente-detalle-notas">
              <span className="cliente-detalle-label">Notas</span>
              <p>{cliente.notas}</p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="perfil-form">
          <div className="field">
            <label>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Empresa</label>
              <input name="empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Correo</label>
            <input name="correo" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          </div>
          <div className="field">
            <label>Sitio web</label>
            <input name="sitioWeb" value={form.sitioWeb} onChange={(e) => setForm({ ...form, sitioWeb: e.target.value })} />
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
