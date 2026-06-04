import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

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

export default function NuevoViaje() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destino: '',
    fechaInicio: '',
    fechaFin: '',
    presupuesto: '',
    moneda: 'MXN',
    notas: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.destino.trim()) {
      setError('El destino es obligatorio');
      return;
    }
    if (!form.fechaInicio) {
      setError('La fecha de inicio es obligatoria');
      return;
    }
    if (form.fechaFin && form.fechaInicio > form.fechaFin) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    try {
      const body: any = { destino: form.destino, fechaInicio: safeDate(form.fechaInicio) };
      if (form.fechaFin) body.fechaFin = safeDate(form.fechaFin);
      if (form.presupuesto) body.presupuesto = Number(form.presupuesto);
      if (form.moneda !== 'MXN') body.moneda = form.moneda;
      if (form.notas) body.notas = form.notas;

      await api.post('/viajes', body);
      navigate('/viajes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el viaje');
    }
  };

  return (
    <div className="page-viajes">
      <div className="page-header">
        <button className="btn-icon-only" onClick={() => navigate('/viajes')} aria-label="Volver">
          <IconArrowLeft />
        </button>
        <h1>Nuevo viaje</h1>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form viajes-form">
        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Destino *</label>
          <input name="destino" value={form.destino} onChange={handleChange} required placeholder="Ej: Playa del Carmen" />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Fecha de inicio *</label>
            <input name="fechaInicio" type="date" value={form.fechaInicio} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Fecha de fin</label>
            <input name="fechaFin" type="date" value={form.fechaFin} onChange={handleChange} min={form.fechaInicio || undefined} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Presupuesto</label>
            <input name="presupuesto" type="number" step="0.01" min="0" value={form.presupuesto} onChange={handleChange} placeholder="0.00" />
          </div>
          <div className="field">
            <label>Moneda</label>
            <select name="moneda" value={form.moneda} onChange={handleChange}>
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
          <label>Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} placeholder="Itinerario, alojamiento, transporte..." />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Guardar viaje</button>
          <button type="button" onClick={() => navigate('/viajes')} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
