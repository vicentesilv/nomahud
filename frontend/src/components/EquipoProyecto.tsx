import { useState, useEffect } from 'react';
import api from '../services/api';

interface Miembro {
  id: number;
  usuarioId: number;
  nombre: string;
  correo: string;
  rol: 'editor' | 'lector';
}

interface Equipo {
  propietario: { id: number; nombre: string; correo: string };
  miembros: Miembro[];
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCrown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l4 4 6-7 6 7 4-4-1.5 10.5h-17L2 8z" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function EquipoProyecto({ proyectoId, puedeGestionar = false }: { proyectoId: number; puedeGestionar?: boolean }) {
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'editor' | 'lector'>('editor');
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargar = () => {
    api.get(`/proyectos/${proyectoId}/miembros`).then(({ data }) => setEquipo(data)).catch(() => {});
  };

  useEffect(() => { cargar(); }, [proyectoId]);

  const invitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    setMsg('');
    try {
      const { data } = await api.post(`/proyectos/${proyectoId}/invitar`, { email: email.trim(), rol });
      setMsg(data.mensaje);
      setEmail('');
      cargar();
    } catch (err: unknown) {
      const mensaje = (err as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      setMsg(typeof mensaje === 'string' ? mensaje : 'No se pudo enviar la invitación');
    } finally {
      setEnviando(false);
    }
  };

  const expulsar = async (usuarioId: number, nombre: string) => {
    if (!confirm(`¿Quitar a ${nombre} del proyecto?`)) return;
    try {
      await api.delete(`/proyectos/${proyectoId}/miembros/${usuarioId}`);
      cargar();
    } catch {
      setMsg('No se pudo quitar al miembro');
    }
  };

  const cambiarRol = async (usuarioId: number, nuevoRol: 'editor' | 'lector') => {
    try {
      await api.patch(`/proyectos/${proyectoId}/miembros/${usuarioId}`, { rol: nuevoRol });
      cargar();
    } catch (err: unknown) {
      const mensaje = (err as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      setMsg(typeof mensaje === 'string' ? mensaje : 'No se pudo cambiar el rol');
    }
  };

  if (!equipo) return null;
  const total = equipo.miembros.length + 1;

  return (
    <section className="equipo-card">
      <div className="equipo-header">
        <span className="equipo-titulo"><IconUsers /> Equipo</span>
        <span className="equipo-count">{total} {total === 1 ? 'persona' : 'personas'}</span>
      </div>

      <ul className="equipo-lista">
        <li className="equipo-miembro equipo-propietario">
          <span className="equipo-avatar" aria-hidden>{iniciales(equipo.propietario.nombre)}</span>
          <span className="equipo-info">
            <strong>{equipo.propietario.nombre}</strong>
            <em>{equipo.propietario.correo}</em>
          </span>
          <span className="badge badge-accent equipo-rol"><IconCrown /> Propietario</span>
        </li>
        {equipo.miembros.map((m) => (
          <li key={m.id} className="equipo-miembro">
            <span className="equipo-avatar" aria-hidden>{iniciales(m.nombre)}</span>
            <span className="equipo-info">
              <strong>{m.nombre}</strong>
              <em>{m.correo}</em>
            </span>
            <span className="equipo-acciones">
              {puedeGestionar ? (
                <select
                  value={m.rol}
                  onChange={(e) => cambiarRol(m.usuarioId, e.target.value as 'editor' | 'lector')}
                  title="Cambiar acceso"
                  className="equipo-select"
                >
                  <option value="editor">Editor · puede crear y editar</option>
                  <option value="lector">Lector · solo lectura</option>
                </select>
              ) : (
                <span className={`badge ${m.rol === 'editor' ? 'badge-success' : 'badge-warning'}`}>
                  {m.rol === 'editor' ? 'Editor' : 'Lector'}
                </span>
              )}
              {puedeGestionar && (
                <button
                  onClick={() => expulsar(m.usuarioId, m.nombre)}
                  className="btn-secondary equipo-quitar"
                  title={`Quitar a ${m.nombre}`}
                >
                  Quitar
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {puedeGestionar ? (
        <form onSubmit={invitar} className="equipo-invitar">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="equipo-input"
          />
          <select value={rol} onChange={(e) => setRol(e.target.value as 'editor' | 'lector')} className="equipo-select" title="Rol de la invitación">
            <option value="editor">Editor</option>
            <option value="lector">Lector</option>
          </select>
          <button type="submit" disabled={enviando} className="btn-primary equipo-invitar-btn">
            {enviando ? 'Enviando...' : (<><IconSend /> Invitar</>)}
          </button>
        </form>
      ) : (
        equipo.miembros.length === 0 && (
          <p className="equipo-vacio">Trabajando en solitario por ahora.</p>
        )
      )}
      {msg && <p className="equipo-msg">{msg}</p>}
    </section>
  );
}
