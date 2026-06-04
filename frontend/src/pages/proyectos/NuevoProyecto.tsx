import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ClienteOption {
  id: number;
  nombre: string;
  empresa: string;
}

function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
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
    <div className="page-proyectos">
      <div className="page-header">
        <h1>Nuevo proyecto</h1>
        <button onClick={() => navigate('/proyectos')} className="btn-secondary btn-icon">
          <IconArrowLeft />
          Volver
        </button>
      </div>

      {error && <div className="msg-floating error"><IconInfo />{error}</div>}

      <form onSubmit={handleSubmit} className="perfil-form">
        <div className="perfil-form-section">
          <div className="perfil-card-header">
            <IconInfo />
            <h3>Información del proyecto</h3>
          </div>

          <div className="field">
            <label>Nombre del proyecto *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: Rediseño web corporativo" />
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} placeholder="Describí el objetivo y alcance del proyecto..." />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Prioridad</label>
              <div className="select-wrapper">
                <select name="prioridad" value={form.prioridad} onChange={handleChange}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Cliente</label>
              <div className="select-wrapper">
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
          </div>
        </div>

        <div className="perfil-form-section">
          <div className="perfil-card-header">
            <IconDollar />
            <h3>Presupuesto</h3>
          </div>

          <div className="field">
            <label>Ganancia estimada (USD)</label>
            <input name="ganancia" type="number" value={form.ganancia} onChange={handleChange} placeholder="5000" />
          </div>
        </div>

        <div className="perfil-form-section">
          <div className="perfil-card-header">
            <IconCalendar />
            <h3>Fechas</h3>
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
        </div>

        <div className="form-actions-bar">
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <IconSave />
              Crear proyecto
            </button>
            <button type="button" onClick={() => navigate('/proyectos')} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
