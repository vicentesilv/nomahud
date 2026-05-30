import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

interface PerfilPublico {
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
  usuario?: { nombre: string; ciudad: string };
}

const ESTADOS_LABORALES: Record<string, string> = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  noDisponible: 'No disponible',
};

export default function PerfilPublico() {
  const { id } = useParams();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/perfiles/${id}`)
      .then(({ data }) => setPerfil(data))
      .catch((err) => setError(err.response?.data?.message || 'Perfil no encontrado'));
  }, [id]);

  if (error) return <div className="loading">{error}</div>;
  if (!perfil) return <div className="loading">Cargando perfil...</div>;

  const nombre = perfil.usuario?.nombre || `Usuario #${perfil.usuarioId}`;
  const initials = nombre
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-perfil">
      <div className="page-header">
        <h1>Perfil público</h1>
      </div>

      <div className="perfil-view">
        <div className="perfil-section">
          <div className="perfil-header">
            {perfil.avatarUrl ? (
              <img src={perfil.avatarUrl} alt="Avatar" className="avatar" />
            ) : (
              <div className="avatar-placeholder">{initials}</div>
            )}
            <div className="perfil-header-info">
              <h2>{nombre}</h2>
              {perfil.usuario?.ciudad && <p>📍 {perfil.usuario.ciudad}</p>}
              <div style={{ marginTop: '0.4rem' }}>
                <span className={`badge ${perfil.estadoLaboral === 'disponible' ? 'badge-success' : perfil.estadoLaboral === 'ocupado' ? 'badge-warning' : 'badge-error'}`}>
                  {ESTADOS_LABORALES[perfil.estadoLaboral] || perfil.estadoLaboral}
                </span>
              </div>
            </div>
          </div>
        </div>

        {perfil.bio && (
          <div className="perfil-section">
            <h3>✦ Sobre mí</h3>
            <p>{perfil.bio}</p>
            {perfil.sitioWeb && (
              <p style={{ marginTop: '0.75rem' }}>
                <strong>Web:</strong>{' '}
                <a href={perfil.sitioWeb} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                  {perfil.sitioWeb}
                </a>
              </p>
            )}
          </div>
        )}

        {perfil.skills?.length ? (
          <div className="perfil-section">
            <h3>◎ Habilidades</h3>
            <div className="skills-tags">
              {perfil.skills.map((s, i) => (
                <span key={i} className="skill-tag">{s}</span>
              ))}
            </div>
          </div>
        ) : null}

        {perfil.idiomas?.length ? (
          <div className="perfil-section">
            <h3>◈ Idiomas</h3>
            <div>
              {perfil.idiomas.map((i, idx) => (
                <span key={idx} className="idioma-item">{i.idioma} · {i.nivel}</span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="perfil-section">
          <h3>⟡ Ubicación</h3>
          <p><strong>Zona horaria:</strong> {perfil.zonaHoraria || '-'}</p>
          <p><strong>Ubicación actual:</strong> {[perfil.ciudadActual, perfil.paisActual].filter(Boolean).join(', ') || '-'}</p>
          <p><strong>Moneda:</strong> {perfil.monedaPreferida}</p>
        </div>
      </div>
    </div>
  );
}
