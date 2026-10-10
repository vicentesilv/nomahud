import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

export const MONEDAS_SOPORTADAS = ['USD', 'EUR', 'ARS', 'BRL', 'MXN', 'COP', 'CLP', 'PEN', 'CRC'] as const;
export type MonedaCodigo = (typeof MONEDAS_SOPORTADAS)[number];

/** Tasas de respaldo (unidades por 1 USD) por si la API externa no responde. */
const TASAS_RESPALDO: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    ARS: 1000,
    BRL: 5.4,
    MXN: 17.2,
    COP: 4100,
    CLP: 930,
    PEN: 3.75,
    CRC: 520,
};

interface CacheTasas {
    base: string;
    fecha: string;
    tasas: Record<string, number>;
    obtenidasEn: number;
}

const TTL_MS = 12 * 60 * 60 * 1000;

@Injectable()
export class DivisasService {
    private readonly logger = new Logger(DivisasService.name);
    private cache: CacheTasas | null = null;

    validarMoneda(moneda: string): void {
        if (!MONEDAS_SOPORTADAS.includes(moneda as MonedaCodigo)) {
            throw new BadRequestException(`Moneda no soportada: ${moneda}`);
        }
    }

    async getTasas(base = 'USD'): Promise<{ base: string; fecha: string; tasas: Record<string, number> }> {
        const b = (base || 'USD').toUpperCase();
        this.validarMoneda(b);
        const ahora = Date.now();
        if (this.cache && this.cache.base === b && ahora - this.cache.obtenidasEn < TTL_MS) {
            return { base: this.cache.base, fecha: this.cache.fecha, tasas: this.cache.tasas };
        }
        const tasas = await this.descargarTasas(b);
        const fecha = new Date().toISOString().slice(0, 10);
        this.cache = { base: b, fecha, tasas, obtenidasEn: ahora };
        return { base: b, fecha, tasas };
    }

    async convertir(monto: number, de: string, a: string): Promise<number> {
        const origen = (de || 'USD').toUpperCase();
        const destino = (a || 'USD').toUpperCase();
        if (origen === destino) return Number(monto);
        this.validarMoneda(origen);
        this.validarMoneda(destino);
        const { tasas } = await this.getTasas('USD');
        const enUSD = Number(monto) / (tasas[origen] || 1);
        return enUSD * (tasas[destino] || 1);
    }

    @Cron('0 6 * * *')
    async precalentar(): Promise<void> {
        try {
            await this.getTasas('USD');
            this.logger.log('Tasas de cambio actualizadas');
        } catch (error) {
            this.logger.warn(`No se pudieron actualizar las tasas: ${error instanceof Error ? error.message : error}`);
        }
    }

    private async descargarTasas(base: string): Promise<Record<string, number>> {
        try {
            const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
            if (data.result !== 'success' || !data.rates) throw new Error('Respuesta inválida');
            const tasas: Record<string, number> = {};
            for (const m of MONEDAS_SOPORTADAS) {
                if (typeof data.rates[m] === 'number') tasas[m] = data.rates[m];
            }
            if (!tasas[base]) throw new Error('Sin tasas útiles');
            return { ...TASAS_RESPALDO, ...tasas };
        } catch (error) {
            this.logger.warn(`API de tasas falló, usando respaldo: ${error instanceof Error ? error.message : error}`);
            if (base !== 'USD') {
                const enUSD = TASAS_RESPALDO[base] || 1;
                const convertidas: Record<string, number> = {};
                for (const [k, v] of Object.entries(TASAS_RESPALDO)) convertidas[k] = v / enUSD;
                return convertidas;
            }
            return { ...TASAS_RESPALDO };
        }
    }
}
