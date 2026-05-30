import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function NuevoCliente() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    correo: '',
    telefono: '',
    sitioWeb: '',
    notas: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim()) {
      setError('El nombre del cliente es obligatorio');
      return;
    }

    try {
      const body: any = { nombre: form.nombre };
      if (form.empresa) body.empresa = form.empresa;
      if (form.correo) body.correo = form.correo;
      if (form.telefono) body.telefono = form.telefono;
      if (form.sitioWeb) body.sitioWeb = form.sitioWeb;
      if (form.notas) body.notas = form.notas;

      await api.post('/clientes', body);
      navigate('/clientes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el cliente');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Nuevo cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Nombre del cliente" />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Empresa</label>
            <input name="empresa" value={form.empresa} onChange={handleChange} placeholder="Nombre de la empresa" />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+54 11 1234-5678" />
          </div>
        </div>

        <div className="field">
          <label>Correo electrónico</label>
          <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="cliente@correo.com" />
        </div>

        <div className="field">
          <label>Sitio web</label>
          <input name="sitioWeb" value={form.sitioWeb} onChange={handleChange} placeholder="https://..." />
        </div>

        <div className="field">
          <label>Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} placeholder="Información adicional..." />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Guardar cliente</button>
          <button type="button" onClick={() => navigate('/clientes')} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
