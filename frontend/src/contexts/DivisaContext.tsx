import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';

export const MONEDAS = ['USD', 'EUR', 'ARS', 'BRL', 'MXN', 'COP', 'CLP', 'PEN', 'CRC'];

interface DivisaContextType {
  moneda: string;
  tasas: Record<string, number>;
  listo: boolean;
  convertir: (monto: number, desde?: string) => number;
  formatear: (monto: number, desde?: string) => string;
  recargar: () => Promise<void>;
}

const DivisaContext = createContext<DivisaContextType | null>(null);

export function DivisaProvider({ children }: { children: ReactNode }) {
  const [moneda, setMoneda] = useState('USD');
  const [tasas, setTasas] = useState<Record<string, number>>({ USD: 1 });
  const [listo, setListo] = useState(false);

  const recargar = useCallback(async () => {
    try {
      const [{ data: perfil }, { data: t }] = await Promise.all([
        api.get('/perfiles/mi-perfil'),
        api.get('/divisas/tasas', { params: { base: 'USD' } }),
      ]);
      if (perfil?.monedaPreferida) setMoneda(perfil.monedaPreferida);
      if (t?.tasas) setTasas(t.tasas);
    } catch {
      /* usa valores por defecto */
    } finally {
      setListo(true);
    }
  }, []);

  useEffect(() => {
    recargar();
    window.addEventListener('nomahud:perfil-actualizado', recargar);
    return () => window.removeEventListener('nomahud:perfil-actualizado', recargar);
  }, [recargar]);

  const convertir = useCallback(
    (monto: number, desde?: string) => {
      const origen = (desde || 'USD').toUpperCase();
      if (origen === moneda) return Number(monto);
      const enUSD = Number(monto) / (tasas[origen] || 1);
      return enUSD * (tasas[moneda] || 1);
    },
    [tasas, moneda],
  );

  const formatear = useCallback(
    (monto: number, desde?: string) => {
      const valor = convertir(monto, desde);
      try {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(valor);
      } catch {
        return `${moneda} ${valor.toFixed(2)}`;
      }
    },
    [convertir, moneda],
  );

  return (
    <DivisaContext.Provider value={{ moneda, tasas, listo, convertir, formatear, recargar }}>
      {children}
    </DivisaContext.Provider>
  );
}

export function useDivisa(): DivisaContextType {
  const context = useContext(DivisaContext);
  if (!context) {
    throw new Error('useDivisa debe usarse dentro de DivisaProvider');
  }
  return context;
}
