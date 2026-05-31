import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ClienteOption { id: number; nombre: string }
interface ProyectoOption { id: number; nombre: string; clienteRel: { id: number; nombre: string } | null }

const CATEGORIAS = [
  'Desarrollo', 'Diseño', 'Consultoría', 'Marketing', 'Freelance',
  'Suscripciones', 'Viajes', 'Alojamiento', 'Comida', 'Transporte',
  'Seguros', 'Salud', 'Equipamiento', 'Software', 'Formación', 'Otros',
];

const MONEDAS = ['USD', 'EUR', 'ARS', 'BRL', 'MXN', 'COP', 'CLP', 'PEN', 'CRC'];

export default function NuevaTransaccion() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoOption[]>([]);
  const [form, setForm] = useState({
    tipo: 'gasto',
    categoria: '',
    monto: '',
    moneda: 'USD',
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
    proyectoId: '',
    clienteId: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/clientes'),
      api.get('/proyectos'),
    ]).then(([cData, pData]) => {
      setClientes(cData.data);
      setProyectos(pData.data);
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'proyectoId') {
      const proyecto = proyectos.find((p) => String(p.id) === value);
      setForm({
        ...form,
        proyectoId: value,
        clienteId: proyecto?.clienteRel ? String(proyecto.clienteRel.id) : '',
      });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.categoria || !form.monto || !form.fecha) {
      setError('Completa los campos obligatorios');
      return;
    }

    try {
      const body: any = {
        tipo: form.tipo,
        categoria: form.categoria,
        monto: Number(form.monto),
        moneda: form.moneda,
        fecha: form.fecha,
      };
      if (form.descripcion) body.descripcion = form.descripcion;
      if (form.proyectoId) body.proyectoId = Number(form.proyectoId);
      if (form.clienteId) body.clienteId = Number(form.clienteId);

      await api.post('/finanzas', body);
      navigate('/finanzas');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear transacción');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Nueva transacción</h1>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        {error && <div className="error-msg">{error}</div>}

        <div className="field-row">
          <div className="field">
            <label>Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange}>
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </div>
          <div className="field">
            <label>Categoría *</label>
            <select name="categoria" value={form.categoria} onChange={handleChange} required>
              <option value="">Seleccionar...</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Monto *</label>
            <input name="monto" type="number" step="0.01" value={form.monto} onChange={handleChange} required placeholder="0.00" />
          </div>
          <div className="field">
            <label>Moneda</label>
            <select name="moneda" value={form.moneda} onChange={handleChange}>
              {MONEDAS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Fecha *</label>
          <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
        </div>

        <div className="field">
          <label>Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} placeholder="Concepto de la transacción..." />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Proyecto</label>
            <select name="proyectoId" value={form.proyectoId} onChange={handleChange}>
              <option value="">— Ninguno —</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cliente</label>
            <select name="clienteId" value={form.clienteId} onChange={handleChange}>
              <option value="">— Ninguno —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Guardar transacción</button>
          <button type="button" onClick={() => navigate('/finanzas')} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
