import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (nuevaContrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!token) {
      setError('Token de recuperación inválido o faltante');
      return;
    }

    try {
      const { data } = await api.post('/auth/restablecer-contrasena', {
        token,
        nuevaContrasena,
      });
      setMensaje(data.mensaje);
      setTimeout(() => navigate('/inicio-sesion'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">✦</div>
            <h1>Noma<span>Hud</span></h1>
          </div>
          <h1>Enlace inválido</h1>
          <div className="error-msg">El enlace de recuperación no es válido o ha expirado.</div>
          <p className="auth-link">
            <Link to="/olvide-contrasena">Solicitar nuevo enlace</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">✦</div>
          <h1>Noma<span>Hud</span></h1>
          <p>Nueva contraseña</p>
        </div>
        {!mensaje ? (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
            <div className="field">
              <label>Nueva contraseña</label>
              <input type="password" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} required minLength={8} placeholder="Mín. 8 caracteres" />
            </div>
            <div className="field">
              <label>Confirmar contraseña</label>
              <input type="password" value={confirmarContrasena} onChange={(e) => setConfirmarContrasena(e.target.value)} required minLength={8} placeholder="Repite la contraseña" />
            </div>
            <button type="submit" className="btn-primary">Restablecer</button>
          </form>
        ) : (
          <div>
            <div className="success-msg">{mensaje}</div>
            <p className="auth-link" style={{ marginTop: '1rem' }}>
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        )}
        <p className="auth-link">
          <Link to="/inicio-sesion">Volver a inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
