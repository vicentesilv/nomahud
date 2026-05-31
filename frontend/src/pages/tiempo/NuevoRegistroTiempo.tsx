import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ProyectoOption { id: number; nombre: string }
interface TareaOption { id: number; titulo: string }

export default function NuevoRegistroTiempo() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState<ProyectoOption[]>([]);
  const [tareas, setTareas] = useState<TareaOption[]>([]);
  const [form, setForm] = useState({
    proyectoId: '',
    tareaId: '',
    horas: '',
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/proyectos').then(({ data }) => setProyectos(data)).catch(() => {});
  }, []);

  const handleProyectoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setForm({ ...form, proyectoId: value, tareaId: '' });
    if (value) {
      try {
        const { data } = await api.get(`/tareas/proyecto/${value}`);
        setTareas(data);
      } catch { setTareas([]); }
    } else {
      setTareas([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.proyectoId || !form.horas || !form.fecha) {
      setError('Completa los campos obligatorios');
      return;
    }

    try {
      const body: any = {
        proyectoId: Number(form.proyectoId),
        horas: Number(form.horas),
        fecha: form.fecha,
      };
      if (form.tareaId) body.tareaId = Number(form.tareaId);
      if (form.descripcion) body.descripcion = form.descripcion;

      await api.post('/tiempo', body);
      navigate('/tiempo');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Registrar horas</h1>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Proyecto *</label>
          <select value={form.proyectoId} onChange={handleProyectoChange} required>
            <option value="">Seleccionar...</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tarea</label>
          <select value={form.tareaId} onChange={(e) => setForm({ ...form, tareaId: e.target.value })}>
            <option value="">— Sin tarea —</option>
            {tareas.map((t) => (
              <option key={t.id} value={t.id}>{t.titulo}</option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Horas *</label>
            <input name="horas" type="number" step="0.25" value={form.horas} onChange={(e) => setForm({ ...form, horas: e.target.value })} required placeholder="2.5" />
          </div>
          <div className="field">
            <label>Fecha *</label>
            <input name="fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
          </div>
        </div>

        <div className="field">
          <label>Descripción</label>
          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} placeholder="¿En qué trabajaste?" />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Guardar registro</button>
          <button type="button" onClick={() => navigate('/tiempo')} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
