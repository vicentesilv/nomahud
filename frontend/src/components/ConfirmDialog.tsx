import { useEffect, useRef, useCallback } from 'react';

interface Props {
  titulo: string;
  mensaje: string;
  confirmarTexto?: string;
  cancelarTexto?: string;
  peligroso?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmDialog({
  titulo,
  mensaje,
  confirmarTexto = 'Confirmar',
  cancelarTexto = 'Cancelar',
  peligroso = false,
  onConfirmar,
  onCancelar,
}: Props) {
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const manejarTecla = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancelar();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    },
    [onCancelar],
  );

  useEffect(() => {
    document.addEventListener('keydown', manejarTecla, true);
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => confirmarRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', manejarTecla, true);
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [manejarTecla]);

  return (
    <div
      className="confirm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancelar();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-mensaje"
      >
        <h3 id="confirm-titulo" className="confirm-titulo">{titulo}</h3>
        <p id="confirm-mensaje" className="confirm-mensaje">{mensaje}</p>
        <div className="confirm-acciones">
          <button ref={cancelarRef} onClick={onCancelar} className="btn-secondary" autoFocus={false}>
            {cancelarTexto}
          </button>
          <button
            ref={confirmarRef}
            onClick={onConfirmar}
            className={peligroso ? 'btn-danger' : 'btn-primary'}
          >
            {confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  );
}
