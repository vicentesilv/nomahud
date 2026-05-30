import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', ciudad: '', fechaNacimiento: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register(form.nombre, form.correo, form.contrasena, form.ciudad || undefined, form.fechaNacimiento || undefined);
      setSuccess('Registro exitoso. Revisa tu correo para confirmar la cuenta.');
      setTimeout(() => navigate('/inicio-sesion'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">✦</div>
          <h1>Noma<span>Hud</span></h1>
          <p>Únete a la comunidad nómada</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}
          <div className="field">
            <label>Nombre</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Tu nombre" />
          </div>
          <div className="field">
            <label>Correo electrónico</label>
            <input name="correo" type="email" value={form.correo} onChange={handleChange} required placeholder="tu@correo.com" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input name="contrasena" type="password" value={form.contrasena} onChange={handleChange} required placeholder="Mín. 8 caracteres" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Ciudad</label>
              <input name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Tu ciudad" />
            </div>
            <div className="field">
              <label>Fecha de nacimiento</label>
              <input name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Crear cuenta</button>
        </form>
        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/inicio-sesion">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
