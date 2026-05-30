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

  return (
    <div className="page-perfil">
      <div className="page-header">
        <h1>Cliente</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!editando && (
            <>
              <button onClick={() => setEditando(true)} className="btn-secondary">✎ Editar</button>
              <button onClick={eliminar} className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>✕ Eliminar</button>
            </>
          )}
          <button onClick={() => navigate('/clientes')} className="btn-secondary">Volver</button>
        </div>
      </div>

      {msg && <div className={msg.includes('Error') ? 'error-msg' : 'success-msg'}>{msg}</div>}

      {!editando ? (
        <div className="perfil-view">
          <div className="perfil-section">
            <h3>✦ Información</h3>
            <p><strong>Nombre:</strong> {cliente.nombre}</p>
            {cliente.empresa && <p><strong>Empresa:</strong> {cliente.empresa}</p>}
            {cliente.correo && <p><strong>Correo:</strong> {cliente.correo}</p>}
            {cliente.telefono && <p><strong>Teléfono:</strong> {cliente.telefono}</p>}
            {cliente.sitioWeb && (
              <p><strong>Web:</strong> <a href={cliente.sitioWeb} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{cliente.sitioWeb}</a></p>
            )}
          </div>
          {cliente.notas && (
            <div className="perfil-section">
              <h3>◈ Notas</h3>
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
