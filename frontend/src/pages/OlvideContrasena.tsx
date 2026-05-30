import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function OlvideContrasena() {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      const { data } = await api.post('/auth/solicitar-recuperacion', { correo });
      setMensaje(data.mensaje);
      setEnviado(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al solicitar recuperación');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">✦</div>
          <h1>Noma<span>Hud</span></h1>
          <p>Recupera tu acceso</p>
        </div>
        {!enviado ? (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
            <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
            <div className="field">
              <label>Correo electrónico</label>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required placeholder="tu@correo.com" />
            </div>
            <button type="submit" className="btn-primary">Enviar instrucciones</button>
          </form>
        ) : (
          <div>
            <div className="success-msg">{mensaje}</div>
            <p className="auth-link" style={{ marginTop: '1.25rem' }}>
              <Link to="/inicio-sesion">Volver a inicio de sesión</Link>
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
