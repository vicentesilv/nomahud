import { useState, useEffect, type FormEvent } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Perfil {
  id: number;
  usuarioId: number;
  bio: string;
  avatarUrl: string;
  sitioWeb: string;
  skills: string[];
  idiomas: { idioma: string; nivel: string }[];
  zonaHoraria: string;
  estadoLaboral: string;
  paisActual: string;
  ciudadActual: string;
  monedaPreferida: string;
}

const ESTADOS_LABORALES: Record<string, string> = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  noDisponible: 'No disponible',
};

const MONEDAS = ['USD', 'EUR', 'ARS', 'BRL', 'MXN', 'COP', 'CLP', 'PEN', 'CRC'];

export default function MiPerfil() {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    bio: '', sitioWeb: '', skills: '', idiomas: '',
    zonaHoraria: '', estadoLaboral: 'disponible',
    paisActual: '', ciudadActual: '', monedaPreferida: 'USD',
    avatarUrl: '',
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/perfiles/mi-perfil').then(({ data }) => {
      setPerfil(data);
      setForm({
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
        sitioWeb: data.sitioWeb || '',
        skills: data.skills?.join(', ') || '',
        idiomas: data.idiomas?.map((i: any) => `${i.idioma}:${i.nivel}`).join(', ') || '',
        zonaHoraria: data.zonaHoraria || '',
        estadoLaboral: data.estadoLaboral || 'disponible',
        paisActual: data.paisActual || '',
        ciudadActual: data.ciudadActual || '',
        monedaPreferida: data.monedaPreferida || 'USD',
      });
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const body = {
        ...form,
        skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        idiomas: form.idiomas ? form.idiomas.split(',').map((s) => {
          const [idioma, nivel] = s.trim().split(':');
          return { idioma, nivel: nivel || 'básico' };
        }).filter((i) => i.idioma) : [],
      };
      const { data } = await api.patch('/perfiles/mi-perfil', body);
      setPerfil(data);
      setEditando(false);
      setMsg('Perfil actualizado correctamente');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Error al actualizar');
    }
  };

  if (!perfil) return <div className="loading">Cargando perfil...</div>;

  const initials = usuario?.nombre
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="page-perfil">
      <div className="page-header">
        <h1>Mi Perfil</h1>
        {!editando && (
          <button onClick={() => setEditando(true)} className="btn-secondary">
            ✎ Editar perfil
          </button>
        )}
      </div>

      {msg && <div className={msg.includes('Error') ? 'error-msg' : 'success-msg'}>{msg}</div>}

      {!editando ? (
        <div className="perfil-view">
          <div className="perfil-section">
            <div className="perfil-header">
              {perfil.avatarUrl ? (
                <img src={perfil.avatarUrl} alt="Avatar" className="avatar" />
              ) : (
                <div className="avatar-placeholder">{initials}</div>
              )}
              <div className="perfil-header-info">
                <h2>{usuario?.nombre}</h2>
                <p>{usuario?.correo}</p>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className={`badge ${perfil.estadoLaboral === 'disponible' ? 'badge-success' : perfil.estadoLaboral === 'ocupado' ? 'badge-warning' : 'badge-error'}`}>
                    {ESTADOS_LABORALES[perfil.estadoLaboral] || perfil.estadoLaboral}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="perfil-section">
            <h3>✦ Sobre mí</h3>
            <p>{perfil.bio || 'Aún no has agregado una biografía.'}</p>
            {perfil.sitioWeb && (
              <p style={{ marginTop: '0.75rem' }}>
                <strong>Web:</strong>{' '}
                <a href={perfil.sitioWeb} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                  {perfil.sitioWeb}
                </a>
              </p>
            )}
          </div>

          <div className="perfil-section">
            <h3>◎ Habilidades</h3>
            {perfil.skills?.length ? (
              <div className="skills-tags">
                {perfil.skills.map((s, i) => (
                  <span key={i} className="skill-tag">{s}</span>
                ))}
              </div>
            ) : (
              <p>Aún no has agregado habilidades.</p>
            )}
          </div>

          <div className="perfil-section">
            <h3>◈ Idiomas</h3>
            {perfil.idiomas?.length ? (
              <div>
                {perfil.idiomas.map((i, idx) => (
                  <span key={idx} className="idioma-item">{i.idioma} · {i.nivel}</span>
                ))}
              </div>
            ) : (
              <p>Aún no has agregado idiomas.</p>
            )}
          </div>

          <div className="perfil-section">
            <h3>⟡ Ubicación</h3>
            <p>
              <strong>Zona horaria:</strong> {perfil.zonaHoraria || '-'}
            </p>
            <p>
              <strong>Ubicación actual:</strong> {[perfil.ciudadActual, perfil.paisActual].filter(Boolean).join(', ') || '-'}
            </p>
            <p>
              <strong>Moneda preferida:</strong> {perfil.monedaPreferida}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="perfil-form">
          <div className="field">
            <label>Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Cuéntale al mundo quién eres..." />
          </div>
          <div className="field">
            <label>Avatar URL</label>
            <input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="field">
            <label>Sitio web</label>
            <input value={form.sitioWeb} onChange={(e) => setForm({ ...form, sitioWeb: e.target.value })} placeholder="https://tusitio.com" />
          </div>
          <div className="field">
            <label>Skills (separados por coma)</label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, Diseño UX" />
          </div>
          <div className="field">
            <label>Idiomas (formato: idioma:nivel)</label>
            <input value={form.idiomas} onChange={(e) => setForm({ ...form, idiomas: e.target.value })} placeholder="Español:nativo, Inglés:avanzado" />
          </div>
          <div className="field">
            <label>Zona horaria</label>
            <input value={form.zonaHoraria} onChange={(e) => setForm({ ...form, zonaHoraria: e.target.value })} placeholder="America/Argentina/Buenos_Aires" />
          </div>
          <div className="field">
            <label>Estado laboral</label>
            <select value={form.estadoLaboral} onChange={(e) => setForm({ ...form, estadoLaboral: e.target.value })}>
              <option value="disponible">Disponible</option>
              <option value="ocupado">Ocupado</option>
              <option value="noDisponible">No disponible</option>
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>País actual</label>
              <input value={form.paisActual} onChange={(e) => setForm({ ...form, paisActual: e.target.value })} placeholder="Argentina" />
            </div>
            <div className="field">
              <label>Ciudad actual</label>
              <input value={form.ciudadActual} onChange={(e) => setForm({ ...form, ciudadActual: e.target.value })} placeholder="Buenos Aires" />
            </div>
          </div>
          <div className="field">
            <label>Moneda preferida</label>
            <select value={form.monedaPreferida} onChange={(e) => setForm({ ...form, monedaPreferida: e.target.value })}>
              {MONEDAS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar cambios</button>
            <button type="button" onClick={() => setEditando(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
