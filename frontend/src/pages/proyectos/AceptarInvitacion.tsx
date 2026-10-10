import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

interface Preview {
  proyectoNombre: string;
  email: string;
  rol: 'editor' | 'lector';
  expiraEn: string;
  usada: boolean;
  expirada: boolean;
}

export default function AceptarInvitacion() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [preview, setPreview] = useState<Preview | null>(null);
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [aceptando, setAceptando] = useState(false);

  useEffect(() => {
    if (!token) {
      setMsg('Enlace inválido: falta el token');
      setCargando(false);
      return;
    }
    api.get(`/proyectos/invitaciones/${token}`)
      .then(({ data }) => {
        setPreview(data);
        if (data.usada) setMsg('Esta invitación ya fue utilizada');
        else if (data.expirada) setMsg('Esta invitación expiró (duraba 7 días)');
        setCargando(false);
      })
      .catch((err) => {
        const m = err.response?.data?.message;
        setMsg(typeof m === 'string' ? m : 'Invitación inválida');
        setCargando(false);
      });
  }, [token]);

  const aceptar = async () => {
    setAceptando(true);
    setMsg('');
    try {
      await api.post('/proyectos/invitaciones/aceptar', { token });
      setOk(true);
      setMsg('¡Te uniste al proyecto!');
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      setMsg(typeof m === 'string' ? m : 'No se pudo aceptar la invitación');
    } finally {
      setAceptando(false);
    }
  };

  if (cargando) return <div className="loading">Cargando invitación...</div>;

  const sinCuenta = msg.includes('registrate primero');

  return (
    <div className="page-tareas" style={{ maxWidth: '560px', margin: '4rem auto', textAlign: 'center' }}>
      <h1>Invitación a proyecto</h1>
      {preview && (
        <div className="proyecto-info-card" style={{ margin: '1.5rem 0', textAlign: 'left' }}>
          <div className="tarea-detalle-row">
            <span className="tarea-detalle-label">Proyecto</span>
            <strong>{preview.proyectoNombre}</strong>
          </div>
          <div className="tarea-detalle-row">
            <span className="tarea-detalle-label">Para</span>
            <span>{preview.email}</span>
          </div>
          <div className="tarea-detalle-row">
            <span className="tarea-detalle-label">Rol</span>
            <span>{preview.rol === 'editor' ? 'Editor (puede crear y editar)' : 'Lector (solo lectura)'}</span>
          </div>
        </div>
      )}
      {msg && <p style={{ marginBottom: '1rem' }}>{msg}</p>}
      {!ok && preview && !preview.usada && !preview.expirada && (
        <button onClick={aceptar} disabled={aceptando} className="btn-primary" style={{ width: 'auto' }}>
          {aceptando ? 'Uniéndome...' : 'Unirme al proyecto'}
        </button>
      )}
      {ok && (
        <button onClick={() => navigate('/inicio-sesion')} className="btn-primary" style={{ width: 'auto' }}>
          Iniciar sesión para verlo
        </button>
      )}
      {sinCuenta && (
        <p style={{ marginTop: '1rem' }}>
          <Link to={`/registro?invitacion=${encodeURIComponent(token)}`} style={{ color: 'var(--accent)' }}>Crear cuenta de invitado con ese correo</Link>
        </p>
      )}
      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/inicio-sesion" style={{ color: 'var(--text-muted)' }}>Volver al inicio</Link>
      </p>
    </div>
  );
}
