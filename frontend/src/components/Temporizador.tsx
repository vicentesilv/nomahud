import { useState, useEffect } from 'react';
import api from '../services/api';

interface Props {
  tareaId: number;
  proyectoId: number;
  titulo: string;
}

interface TimerActivo {
  tareaId: number;
  proyectoId: number;
  titulo: string;
  inicio: string;
}

const CLAVE = 'nomahud-timer-activo';

function leerTimer(): TimerActivo | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as TimerActivo) : null;
  } catch {
    return null;
  }
}

function formato(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Temporizador({ tareaId, proyectoId, titulo }: Props) {
  const [activo, setActivo] = useState<TimerActivo | null>(() => leerTimer());
  const [ahora, setAhora] = useState(() => Date.now());
  const [msg, setMsg] = useState('');
  const [guardando, setGuardando] = useState(false);

  const esMio = activo?.tareaId === tareaId;

  useEffect(() => {
    if (!activo) return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activo]);

  const iniciar = () => {
    const timer: TimerActivo = { tareaId, proyectoId, titulo, inicio: new Date().toISOString() };
    localStorage.setItem(CLAVE, JSON.stringify(timer));
    setActivo(timer);
    setMsg('');
  };

  const detener = async () => {
    if (!activo) return;
    const segundos = Math.max(1, Math.round((Date.now() - new Date(activo.inicio).getTime()) / 1000));
    const horas = Math.max(0.01, Math.round((segundos / 3600) * 100) / 100);
    setGuardando(true);
    try {
      await api.post('/tiempo', {
        proyectoId: activo.proyectoId,
        tareaId: activo.tareaId,
        horas,
        fecha: new Date().toISOString().slice(0, 10),
        descripcion: `Timer: ${activo.titulo} (${formato(segundos)})`,
      });
      localStorage.removeItem(CLAVE);
      setActivo(null);
      setMsg(`Registradas ${horas}h`);
    } catch {
      setMsg('No se pudo guardar el tiempo');
    } finally {
      setGuardando(false);
    }
  };

  if (activo && !esMio) {
    const segs = Math.max(0, Math.round((ahora - new Date(activo.inicio).getTime()) / 1000));
    return (
      <div className="tarea-detalle-row">
        <span className="tarea-detalle-label">Timer</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ▶ {activo.titulo} ({formato(segs)})
        </span>
      </div>
    );
  }

  return (
    <div className="tarea-detalle-row">
      <span className="tarea-detalle-label">Timer</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {esMio && activo ? (
          <>
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formato(Math.max(0, Math.round((ahora - new Date(activo.inicio).getTime()) / 1000)))}
            </strong>
            <button
              onClick={detener}
              disabled={guardando}
              className="btn-secondary"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
            >
              ⏹ Detener
            </button>
          </>
        ) : (
          <button
            onClick={iniciar}
            className="btn-secondary"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
          >
            ▶ Iniciar
          </button>
        )}
      </span>
      {msg && <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{msg}</span>}
    </div>
  );
}
