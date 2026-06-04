import { useState, useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

function getPasswordStrength(pw: string): { score: number; label: string; bars: ('weak' | 'medium' | 'strong')[] } {
  if (!pw) return { score: 0, label: '', bars: [] };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const map = ['', 'weak', 'medium', 'strong', 'strong'] as const;
  return {
    score,
    label: score === 0 ? '' : map[score] ?? 'strong',
    bars: Array.from({ length: 4 }, (_, i) => (i < score ? map[score] || 'weak' : 'weak')) as ('weak' | 'medium' | 'strong')[],
  };
}

export default function Register() {
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', ciudad: '', fechaNacimiento: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const strength = useMemo(() => getPasswordStrength(form.contrasena), [form.contrasena]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await register(form.nombre, form.correo, form.contrasena, form.ciudad || undefined, form.fechaNacimiento || undefined);
      setSuccess('Registro exitoso. Revisa tu correo para confirmar la cuenta.');
      setTimeout(() => navigate('/inicio-sesion'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button
          className={`theme-switch auth-theme-switch ${theme === 'light' ? 'on' : ''}`}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <span className="theme-switch-knob">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {theme === 'dark' ? (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              ) : (
                <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
              )}
            </svg>
          </span>
        </button>
        <div className="auth-logo">
          <div className="auth-logo-icon">✦</div>
          <h1>Noma<span>Hud</span></h1>
          <p>Únete a la comunidad nómada</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}
          <div className="field">
            <label htmlFor="nombre">Nombre</label>
            <div className="input-wrapper">
              <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Tu nombre" autoComplete="name" disabled={isLoading} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="correo">Correo electrónico</label>
            <div className="input-wrapper">
              <input id="correo" name="correo" type="email" value={form.correo} onChange={handleChange} required placeholder="tu@correo.com" autoComplete="email" disabled={isLoading} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="contrasena">Contraseña</label>
            <div className="input-wrapper">
              <input
                id="contrasena"
                name="contrasena"
                type={showPassword ? 'text' : 'password'}
                value={form.contrasena}
                onChange={handleChange}
                required
                placeholder="Mín. 8 caracteres"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {form.contrasena && (
              <>
                <div className="password-strength">
                  {strength.bars.map((b, i) => (
                    <div key={i} className={`password-strength-bar ${b}`} />
                  ))}
                </div>
                <div className={`password-strength-label ${strength.label}`}>
                  {strength.label === 'weak' && 'Débil'}
                  {strength.label === 'medium' && 'Media'}
                  {strength.label === 'strong' && 'Fuerte'}
                </div>
              </>
            )}
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="ciudad">Ciudad</label>
              <input id="ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Tu ciudad" autoComplete="address-level2" disabled={isLoading} />
            </div>
            <div className="field">
              <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
              <input id="fechaNacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} disabled={isLoading} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading && <span className="btn-spinner" />}
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/inicio-sesion">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
