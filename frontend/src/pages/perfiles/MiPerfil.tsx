import { useState, useEffect, useRef, type FormEvent } from 'react';
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

const NIVELES_IDIOMA = ['básico', 'intermedio', 'avanzado', 'nativo', 'fluido'];

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function MiPerfil() {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    bio: '', sitioWeb: '', skills: '', idiomas: '',
    zonaHoraria: '', estadoLaboral: 'disponible',
    paisActual: '', ciudadActual: '', monedaPreferida: 'USD',
    avatarUrl: '',
  });
  const [msg, setMsg] = useState({ text: '', type: '' as '' | 'success' | 'error' });
  const [skillInput, setSkillInput] = useState('');
  const [langInput, setLangInput] = useState('');
  const [langLevel, setLangLevel] = useState('básico');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [formTocado, setFormTocado] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!msg.text) return;
    const t = setTimeout(() => setMsg({ text: '', type: '' }), 2500);
    return () => clearTimeout(t);
  }, [msg]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const skillsArray = form.skills
    ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const idiomasArray = form.idiomas
    ? form.idiomas.split(',').map((s) => {
        const [idioma, nivel] = s.trim().split(':');
        return idioma ? { idioma, nivel: nivel || 'básico' } : null;
      }).filter(Boolean) as { idioma: string; nivel: string }[]
    : [];

  useEffect(() => {
    api.get('/perfiles/mi-perfil').then(({ data }) => {
      setPerfil(data);
      const vals = {
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
      };
      setForm(vals);
      setAvatarPreview(data.avatarUrl || '');
    });
  }, []);

  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    if (form.sitioWeb && !/^https?:\/\/.+/.test(form.sitioWeb)) {
      errs.sitioWeb = 'Ingresá una URL válida (https://...)';
    }
    if (form.bio.length > 2000) {
      errs.bio = `Máximo 2000 caracteres (${form.bio.length}/2000)`;
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setMsg({ text: '', type: '' });
    setGuardando(true);
    try {
      const rawBody: Record<string, any> = {
        ...form,
        skills: skillsArray,
        idiomas: idiomasArray,
      };
      const body = Object.fromEntries(
        Object.entries(rawBody).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
      const { data } = await api.patch('/perfiles/mi-perfil', body);
      setPerfil(data);
      setEditando(false);
      setFormTocado(false);
      setMsg({ text: 'Perfil actualizado correctamente', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al actualizar el perfil', type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const handleCancel = () => {
    if (formTocado) {
      const confirmar = window.confirm('Tenés cambios sin guardar. ¿Estás seguro de querer salir?');
      if (!confirmar) return;
    }
    setEditando(false);
    setMsg({ text: '', type: '' });
    setErrores({});
    setFormTocado(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMsg({ text: 'Solo se permiten imágenes', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMsg({ text: 'La imagen no puede superar los 5MB', type: 'error' });
      return;
    }

    setSubiendoAvatar(true);
    setMsg({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/perfiles/mi-perfil/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPerfil(data);
      setAvatarPreview(data.avatarUrl);
      setForm({ ...form, avatarUrl: data.avatarUrl });
      setFormTocado(true);
      setMsg({ text: 'Foto actualizada correctamente', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || err.message || 'Error al subir la imagen', type: 'error' });
    } finally {
      setSubiendoAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const agregarSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skillsArray.includes(s)) {
      setSkillInput('');
      return;
    }
    const nuevas = [...skillsArray, s];
    setForm({ ...form, skills: nuevas.join(', ') });
    setSkillInput('');
    setFormTocado(true);
  };

  const eliminarSkill = (idx: number) => {
    const nuevas = skillsArray.filter((_, i) => i !== idx);
    setForm({ ...form, skills: nuevas.join(', ') });
    setFormTocado(true);
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarSkill();
    }
  };

  const agregarIdioma = () => {
    const l = langInput.trim();
    if (!l) return;
    if (idiomasArray.some((i) => i.idioma.toLowerCase() === l.toLowerCase())) {
      setLangInput('');
      return;
    }
    const nuevos = [...idiomasArray, { idioma: l, nivel: langLevel }];
    setForm({ ...form, idiomas: nuevos.map((i) => `${i.idioma}:${i.nivel}`).join(', ') });
    setLangInput('');
    setFormTocado(true);
  };

  const eliminarIdioma = (idx: number) => {
    const nuevos = idiomasArray.filter((_, i) => i !== idx);
    setForm({ ...form, idiomas: nuevos.map((i) => `${i.idioma}:${i.nivel}`).join(', ') });
    setFormTocado(true);
  };

  const handleLangKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarIdioma();
    }
  };

  const initials = usuario?.nombre
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  if (!perfil) {
    return (
      <div className="page-perfil">
        <div className="page-header">
          <h1>Mi Perfil</h1>
        </div>
        <div className="perfil-skeleton">
          <div className="skeleton-header">
            <div className="skeleton-avatar" />
            <div className="skeleton-lines">
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-24" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line w-32" />
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-perfil" ref={topRef}>
      <div className="page-header">
        <h1>Mi Perfil</h1>
        {!editando && (
          <button onClick={() => setEditando(true)} className="btn-primary btn-icon">
            <IconEdit />
            Editar perfil
          </button>
        )}
      </div>

      {msg.text && (
        <div className={`msg-floating ${msg.type}`}>
          {msg.type === 'success' ? <IconCheck /> : <IconX />}
          {msg.text}
        </div>
      )}

      {!editando ? (
        <div className="perfil-view">
          <div className="perfil-card perfil-card-hero">
            <div className="perfil-hero-bg" />
            <div className="perfil-hero-content">
              {perfil.avatarUrl ? (
                <img src={perfil.avatarUrl} alt="Avatar" className="perfil-avatar" />
              ) : (
                <div className="perfil-avatar perfil-avatar-placeholder">{initials}</div>
              )}
              <div className="perfil-hero-info">
                <h2 className="perfil-hero-name">{usuario?.nombre}</h2>
                <p className="perfil-hero-email">{usuario?.correo}</p>
                <span className={`badge ${perfil.estadoLaboral === 'disponible' ? 'badge-success' : perfil.estadoLaboral === 'ocupado' ? 'badge-warning' : 'badge-error'}`}>
                  <span className="badge-dot" />
                  {ESTADOS_LABORALES[perfil.estadoLaboral] || perfil.estadoLaboral}
                </span>
              </div>
            </div>
          </div>

          <div className="perfil-card">
            <div className="perfil-card-header">
              <IconHeart />
              <h3>Sobre mí</h3>
            </div>
            <p className="perfil-card-text">{perfil.bio || 'Aún no has agregado una biografía.'}</p>
            {perfil.sitioWeb && (
              <a href={perfil.sitioWeb} target="_blank" rel="noopener noreferrer" className="perfil-link">
                <IconExternalLink />
                {perfil.sitioWeb.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          <div className="perfil-card">
            <div className="perfil-card-header">
              <IconCode />
              <h3>Habilidades</h3>
            </div>
            {perfil.skills?.length ? (
              <div className="skills-tags">
                {perfil.skills.map((s, i) => (
                  <span key={i} className="skill-tag">{s}</span>
                ))}
              </div>
            ) : (
              <p className="perfil-card-text perfil-card-empty">Aún no has agregado habilidades.</p>
            )}
          </div>

          <div className="perfil-card">
            <div className="perfil-card-header">
              <IconGlobe />
              <h3>Idiomas</h3>
            </div>
            {perfil.idiomas?.length ? (
              <div className="idiomas-list">
                {perfil.idiomas.map((i, idx) => (
                  <div key={idx} className="idioma-item">
                    <span className="idioma-name">{i.idioma}</span>
                    <span className="idioma-level">{i.nivel}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="perfil-card-text perfil-card-empty">Aún no has agregado idiomas.</p>
            )}
          </div>

          <div className="perfil-card">
            <div className="perfil-card-header">
              <IconMapPin />
              <h3>Ubicación</h3>
            </div>
            <div className="perfil-info-grid">
              <div className="perfil-info-item">
                <span className="perfil-info-label">Zona horaria</span>
                <span className="perfil-info-value">{perfil.zonaHoraria || '—'}</span>
              </div>
              <div className="perfil-info-item">
                <span className="perfil-info-label">Ubicación actual</span>
                <span className="perfil-info-value">{perfil.ciudadActual && perfil.paisActual ? `${perfil.ciudadActual}, ${perfil.paisActual}` : perfil.ciudadActual || perfil.paisActual || '—'}</span>
              </div>
              <div className="perfil-info-item">
                <span className="perfil-info-label">Moneda preferida</span>
                <span className="perfil-info-value">{perfil.monedaPreferida || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="perfil-form">
          {formTocado && (
            <div className="unsaved-bar">
              <IconAlert />
              Tenés cambios sin guardar
            </div>
          )}

          <div className="perfil-form-section">
            <div className="perfil-card-header">
              <IconUser />
              <h3>Información básica</h3>
            </div>

            <div className="field">
              <label>Foto de perfil</label>
              <div className="avatar-upload">
                <div className="avatar-upload-preview">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="avatar-preview-img"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="avatar-upload-placeholder">{initials}</div>
                  )}
                  <button
                    type="button"
                    className="avatar-edit-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoAvatar}
                    aria-label="Cambiar foto"
                  >
                    {subiendoAvatar ? (
                      <span className="btn-spinner btn-spinner-sm" />
                    ) : (
                      <IconImage />
                    )}
                  </button>
                </div>
                <div className="avatar-upload-info">
                  <button type="button" className="btn-upload" onClick={() => fileInputRef.current?.click()} disabled={subiendoAvatar}>
                    {subiendoAvatar ? (
                      <>Subiendo...</>
                    ) : (
                      <>
                        <IconUpload />
                        Subir foto
                      </>
                    )}
                  </button>
                  <span className="avatar-upload-hint">PNG, JPG o WebP. Máx 5MB.</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="field">
              <label>Biografía</label>
              <textarea
                value={form.bio}
                onChange={(e) => {
                  setForm({ ...form, bio: e.target.value });
                  setFormTocado(true);
                  if (errores.bio) validar();
                }}
                rows={4}
                placeholder="Contá quién sos, tu experiencia, lo que te apasiona..."
              />
              <div className="field-footer">
                {errores.bio && <span className="field-error">{errores.bio}</span>}
                <span className={`char-count ${form.bio.length > 2000 ? 'char-count-over' : ''}`}>
                  {form.bio.length}/2000
                </span>
              </div>
            </div>

            <div className="field">
              <label>Sitio web</label>
              <input
                value={form.sitioWeb}
                onChange={(e) => {
                  setForm({ ...form, sitioWeb: e.target.value });
                  setFormTocado(true);
                  if (errores.sitioWeb) validar();
                }}
                placeholder="https://tusitio.com"
              />
              {errores.sitioWeb && <span className="field-error">{errores.sitioWeb}</span>}
            </div>
          </div>

          <div className="perfil-form-section">
            <div className="perfil-card-header">
              <IconCode />
              <h3>Habilidades</h3>
            </div>

            <div className="field">
              <label>Agregar habilidad</label>
              <div className="tag-input-row">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Ej: React, TypeScript, Node.js..."
                />
                <button type="button" onClick={agregarSkill} className="btn-tag-add" disabled={!skillInput.trim()}>
                  <IconPlus />
                  Agregar
                </button>
              </div>
            </div>

            {skillsArray.length > 0 && (
              <div className="tags-list">
                {skillsArray.map((s, i) => (
                  <span key={i} className="skill-tag skill-tag-removable">
                    {s}
                    <button type="button" onClick={() => eliminarSkill(i)} className="tag-remove" aria-label={`Eliminar ${s}`}>
                      <IconX />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="perfil-form-section">
            <div className="perfil-card-header">
              <IconGlobe />
              <h3>Idiomas</h3>
            </div>

            <div className="field">
              <label>Agregar idioma</label>
              <div className="tag-input-row tag-input-row-lang">
                <input
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={handleLangKeyDown}
                  placeholder="Ej: Inglés, Portugués, Francés..."
                />
                <select value={langLevel} onChange={(e) => setLangLevel(e.target.value)} className="lang-level-select">
                  {NIVELES_IDIOMA.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button type="button" onClick={agregarIdioma} className="btn-tag-add" disabled={!langInput.trim()}>
                  <IconPlus />
                  Agregar
                </button>
              </div>
            </div>

            {idiomasArray.length > 0 && (
              <div className="idiomas-list" style={{ marginTop: '0.75rem' }}>
                {idiomasArray.map((item, i) => (
                  <div key={i} className="idioma-item idioma-item-removable">
                    <span className="idioma-name">{item.idioma}</span>
                    <span className="idioma-level">{item.nivel}</span>
                    <button type="button" onClick={() => eliminarIdioma(i)} className="tag-remove" aria-label={`Eliminar ${item.idioma}`}>
                      <IconX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="perfil-form-section">
            <div className="perfil-card-header">
              <IconMapPin />
              <h3>Ubicación y preferencias</h3>
            </div>

            <div className="field">
              <label>Estado laboral</label>
              <div className="select-wrapper">
                <select value={form.estadoLaboral} onChange={(e) => { setForm({ ...form, estadoLaboral: e.target.value }); setFormTocado(true); }}>
                  <option value="disponible">Disponible</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="noDisponible">No disponible</option>
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>País actual</label>
                <input value={form.paisActual} onChange={(e) => { setForm({ ...form, paisActual: e.target.value }); setFormTocado(true); }} placeholder="Argentina" />
              </div>
              <div className="field">
                <label>Ciudad actual</label>
                <input value={form.ciudadActual} onChange={(e) => { setForm({ ...form, ciudadActual: e.target.value }); setFormTocado(true); }} placeholder="Buenos Aires" />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Zona horaria</label>
                <input value={form.zonaHoraria} onChange={(e) => { setForm({ ...form, zonaHoraria: e.target.value }); setFormTocado(true); }} placeholder="America/Argentina/Buenos_Aires" />
              </div>
              <div className="field">
                <label>Moneda preferida</label>
                <div className="select-wrapper">
                  <select value={form.monedaPreferida} onChange={(e) => { setForm({ ...form, monedaPreferida: e.target.value }); setFormTocado(true); }}>
                    {MONEDAS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions-bar">
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? (
                  <>
                    <span className="btn-spinner" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <IconCheck />
                    Guardar cambios
                  </>
                )}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary" disabled={guardando}>
                <IconX />
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
