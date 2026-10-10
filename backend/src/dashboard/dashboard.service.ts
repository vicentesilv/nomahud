import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In, Raw } from 'typeorm';
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Transaccion } from '../finanzas/entities/transaccion.entity';
import { RegistroTiempo } from '../tiempo/entities/registro-tiempo.entity';
import { Viaje } from '../viajes/entities/viaje.entity';
import { Tarea } from '../tareas/entities/tarea.entity';
import { DivisasService } from '../divisas/divisas.service';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Proyecto)
        private readonly proyectoRepository: Repository<Proyecto>,
        @InjectRepository(Cliente)
        private readonly clienteRepository: Repository<Cliente>,
        @InjectRepository(Transaccion)
        private readonly transaccionRepository: Repository<Transaccion>,
        @InjectRepository(RegistroTiempo)
        private readonly tiempoRepository: Repository<RegistroTiempo>,
        @InjectRepository(Viaje)
        private readonly viajeRepository: Repository<Viaje>,
        @InjectRepository(Tarea)
        private readonly tareaRepository: Repository<Tarea>,
        private readonly divisasService: DivisasService,
    ) {}

    async getResumen(userId: number, moneda?: string) {
        const proyectosActivos = await this.proyectoRepository.count({
            where: { creadorId: userId, estado: 'activo' },
        });

        const totalClientes = await this.clienteRepository.count({
            where: { creadorId: userId },
        });

        const now = new Date();
        const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const mesFin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

        const transacciones = await this.transaccionRepository.find({
            where: {
                creadorId: userId,
                fecha: Raw((alias) => `${alias} >= :inicio AND ${alias} <= :fin`, { inicio: mesInicio, fin: mesFin }),
            },
        });

        const destino = moneda ? moneda.toUpperCase() : null;
        if (destino) this.divisasService.validarMoneda(destino);
        let ingresos = 0;
        let gastos = 0;
        for (const t of transacciones) {
            const monto = destino
                ? await this.divisasService.convertir(Number(t.monto), t.moneda || 'USD', destino)
                : Number(t.monto);
            if (t.tipo === 'ingreso') ingresos += monto;
            else gastos += monto;
        }

        const tiempoMes = await this.tiempoRepository
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.horas), 0)', 'total')
            .where('t.creadorId = :userId', { userId })
            .andWhere('t.fecha >= :inicio', { inicio: mesInicio })
            .andWhere('t.fecha <= :fin', { fin: mesFin })
            .getRawOne();

        const viajesProximos = await this.viajeRepository.find({
            where: {
                creadorId: userId,
                estado: Not(In(['completado', 'cancelado'])),
                fechaInicio: Raw((alias) => `${alias} >= :hoy`, { hoy: now.toISOString().slice(0, 10) }),
            },
            order: { fechaInicio: 'ASC' },
            take: 5,
        });

        const tareasPendientes = await this.tareaRepository.find({
            where: {
                proyecto: { creadorId: userId },
                estado: Not(In(['completada', 'cancelada'])),
            },
            relations: ['proyecto'],
            order: { fechaVencimiento: 'ASC' },
            take: 10,
        });

        const actividadReciente = await this.obtenerActividadReciente(userId, destino);

        return {
            proyectosActivos,
            totalClientes,
            resumenFinanzas: { ingresos, gastos, balance: ingresos - gastos, moneda: destino || 'mixta' },
            horasMes: Number(tiempoMes?.total || 0),
            viajesProximos,
            tareasPendientes,
            actividadReciente,
        };
    }

    private async obtenerActividadReciente(userId: number, moneda: string | null) {
        const items: { tipo: string; descripcion: string; fecha: string; id: number }[] = [];

        const transacciones = await this.transaccionRepository.find({
            where: { creadorId: userId },
            order: { createdAt: 'DESC' },
            take: 5,
        });
        for (const t of transacciones) {
            const monto = moneda
                ? await this.divisasService.convertir(Number(t.monto), t.moneda || 'USD', moneda)
                : Number(t.monto);
            const codigo = moneda || t.moneda || 'USD';
            items.push({
                tipo: t.tipo === 'ingreso' ? 'ingreso' : 'gasto',
                descripcion: `${t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} - ${t.categoria}: ${codigo} ${monto.toFixed(2)}`,
                fecha: t.createdAt.toISOString(),
                id: t.id,
            });
        }

        const tareasCompletadas = await this.tareaRepository.find({
            where: {
                proyecto: { creadorId: userId },
                estado: 'completada',
            },
            relations: ['proyecto'],
            order: { updatedAt: 'DESC' },
            take: 5,
        });
        for (const t of tareasCompletadas) {
            items.push({
                tipo: 'tarea_completada',
                descripcion: `Tarea completada: "${t.titulo}" en ${t.proyecto?.nombre || 'proyecto'}`,
                fecha: t.updatedAt.toISOString(),
                id: t.id,
            });
        }

        items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        return items.slice(0, 10);
    }
}
