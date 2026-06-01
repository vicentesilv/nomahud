import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ConfirmarCuenta() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de confirmación inválido o faltante');
      return;
    }

    const confirmar = async () => {
      setConfirmando(true);
      try {
        const { data } = await api.post('/auth/confirmar-cuenta', { token });
        setMensaje(data.mensaje);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al confirmar la cuenta');
      } finally {
        setConfirmando(false);
      }
    };

    confirmar();
  }, [token]);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">✦</div>
            <h1>Noma<span>Hud</span></h1>
          </div>
          <h1>Enlace inválido</h1>
          <div className="error-msg">El enlace de confirmación no es válido o ha expirado.</div>
          <p className="auth-link">
            <Link to="/inicio-sesion">Volver a inicio de sesión</Link>
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
          <p>Confirmación de cuenta</p>
        </div>
        {confirmando && !mensaje && !error && (
          <div className="info-msg">Confirmando tu cuenta...</div>
        )}
        {error && <div className="error-msg">{error}</div>}
        {mensaje && (
          <>
            <div className="success-msg">{mensaje}</div>
            <p className="auth-link" style={{ marginTop: '1rem' }}>
              <Link to="/inicio-sesion">Iniciar sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
