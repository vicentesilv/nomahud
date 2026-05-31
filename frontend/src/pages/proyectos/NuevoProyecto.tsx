import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ClienteOption {
  id: number;
  nombre: string;
  empresa: string;
}

export default function NuevoProyecto() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    prioridad: 'media',
    clienteId: '',
    ganancia: '',
    fechaInicio: '',
    fechaFin: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/clientes').then(({ data }) => setClientes(data)).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim()) {
      setError('El nombre del proyecto es obligatorio');
      return;
    }

    try {
      const body: any = {
        nombre: form.nombre,
        prioridad: form.prioridad,
      };
      if (form.descripcion) body.descripcion = form.descripcion;
      if (form.clienteId) body.clienteId = Number(form.clienteId);
      if (form.ganancia) body.ganancia = Number(form.ganancia);
      if (form.fechaInicio) body.fechaInicio = form.fechaInicio;
      if (form.fechaFin) body.fechaFin = form.fechaFin;

      await api.post('/proyectos', body);
      navigate('/proyectos');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el proyecto');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Nuevo proyecto</h1>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Nombre del proyecto *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: Rediseño web" />
        </div>

        <div className="field">
          <label>Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} placeholder="Describe el proyecto..." />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Prioridad</label>
            <select name="prioridad" value={form.prioridad} onChange={handleChange}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div className="field">
            <label>Cliente</label>
            <select name="clienteId" value={form.clienteId} onChange={handleChange}>
              <option value="">— Sin cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.empresa ? ` (${c.empresa})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Ganancia estimada</label>
            <input name="ganancia" type="number" value={form.ganancia} onChange={handleChange} placeholder="5000" />
          </div>
          <div className="field" />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Fecha de inicio</label>
            <input name="fechaInicio" type="date" value={form.fechaInicio} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Fecha de fin</label>
            <input name="fechaFin" type="date" value={form.fechaFin} onChange={handleChange} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Crear proyecto</button>
          <button type="button" onClick={() => navigate('/proyectos')} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
