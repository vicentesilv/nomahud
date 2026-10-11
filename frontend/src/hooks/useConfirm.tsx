import { useState, useCallback } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface OpcionesConfirm {
  titulo: string;
  mensaje: string;
  confirmarTexto?: string;
  cancelarTexto?: string;
  peligroso?: boolean;
}

export function useConfirm() {
  const [estado, setEstado] = useState<(OpcionesConfirm & { resolver: (v: boolean) => void }) | null>(null);

  const confirm = useCallback((opciones: OpcionesConfirm): Promise<boolean> => {
    return new Promise((resolver) => {
      setEstado({ ...opciones, resolver });
    });
  }, []);

  const cerrar = useCallback((valor: boolean) => {
    estado?.resolver(valor);
    setEstado(null);
  }, [estado]);

  const dialog = estado ? (
    <ConfirmDialog
      titulo={estado.titulo}
      mensaje={estado.mensaje}
      confirmarTexto={estado.confirmarTexto}
      cancelarTexto={estado.cancelarTexto}
      peligroso={estado.peligroso}
      onConfirmar={() => cerrar(true)}
      onCancelar={() => cerrar(false)}
    />
  ) : null;

  return { confirm, dialog };
}
