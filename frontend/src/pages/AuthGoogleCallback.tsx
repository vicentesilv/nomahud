import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UsuarioGoogle {
  id: number;
  nombre: string;
  correo: string;
  emailVerificado: boolean;
  estadoCuenta: string;
  rol?: 'normal' | 'invitado';
}

function esUsuarioGoogle(value: unknown): value is UsuarioGoogle {
  if (!value || typeof value !== 'object') return false;
  const usuario = value as Record<string, unknown>;
  return typeof usuario.id === 'number'
    && typeof usuario.nombre === 'string'
    && typeof usuario.correo === 'string';
}

export default function AuthGoogleCallback() {
  const { establecerSesion } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const googleError = params.get('error');
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const usuarioRaw = params.get('usuario');

    if (googleError || !token || !refreshToken || !usuarioRaw) {
      setError(googleError || 'No se pudo completar el inicio de sesión con Google.');
      return;
    }

    try {
      const usuario = JSON.parse(usuarioRaw) as unknown;
      if (!esUsuarioGoogle(usuario)) throw new Error('Respuesta de usuario inválida');
      establecerSesion(token, refreshToken, usuario);
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('No se pudo completar el inicio de sesión con Google.');
    }
  }, [establecerSesion, navigate]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-callback-card">
          <div className="error-msg">{error}</div>
          <a href="/inicio-sesion" className="btn-primary">Volver al inicio de sesión</a>
        </div>
      </div>
    );
  }

  return <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Completando inicio de sesión...</div>;
}
