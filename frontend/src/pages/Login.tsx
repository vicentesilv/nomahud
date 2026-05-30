import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(correo, contrasena);
      navigate('/mi-perfil');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">✦</div>
          <h1>Noma<span>Hud</span></h1>
          <p>Tu centro de control nómada digital</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <div className="field">
            <label>Correo electrónico</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required placeholder="tu@correo.com" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary">Entrar</button>
        </form>
        <p className="auth-link">
          <Link to="/olvide-contrasena">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="auth-link">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
