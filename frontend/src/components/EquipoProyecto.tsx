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

export default function EquipoProyecto({ proyectoId }: { proyectoId: number }) {
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

  if (!equipo) return null;

  return (
    <div className="proyecto-info-card" style={{ marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '0.75rem' }}>Equipo</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <div className="tarea-detalle-row">
          <span className="tarea-detalle-label">Propietario</span>
          <span>{equipo.propietario.nombre} <em>({equipo.propietario.correo})</em></span>
        </div>
        {equipo.miembros.map((m) => (
          <div key={m.id} className="tarea-detalle-row">
            <span className="tarea-detalle-label">{m.rol === 'editor' ? 'Editor' : 'Lector'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {m.nombre} <em>({m.correo})</em>
              <button
                onClick={() => expulsar(m.usuarioId, m.nombre)}
                className="btn-secondary"
                style={{ width: 'auto', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
              >
                Quitar
              </button>
            </span>
          </div>
        ))}
        {equipo.miembros.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Solo vos por ahora. Invitá a alguien 👇</p>
        )}
      </div>
      <form onSubmit={invitar} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          style={{ flex: '1 1 200px' }}
        />
        <select value={rol} onChange={(e) => setRol(e.target.value as 'editor' | 'lector')}>
          <option value="editor">Editor</option>
          <option value="lector">Lector</option>
        </select>
        <button type="submit" disabled={enviando} className="btn-primary" style={{ width: 'auto' }}>
          {enviando ? 'Enviando...' : 'Invitar'}
        </button>
      </form>
      {msg && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{msg}</p>}
    </div>
  );
}
