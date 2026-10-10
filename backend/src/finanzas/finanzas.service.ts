import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaccion } from './entities/transaccion.entity';
import { CrearTransaccionDto } from './dtos/crear-transaccion.dto';
import { ActualizarTransaccionDto } from './dtos/actualizar-transaccion.dto';
import { DivisasService } from '../divisas/divisas.service';
import { PaginacionDto, Pagina, paginar, skipTake } from '../common/dtos/paginacion.dto';
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { ProyectoMiembro } from '../proyectos/entities/proyecto-miembro.entity';
import { Cliente } from '../clientes/entities/cliente.entity';

@Injectable()
export class FinanzasService {
    constructor(
        @InjectRepository(Transaccion)
        private readonly transaccionRepository: Repository<Transaccion>,
        private readonly divisasService: DivisasService,
    ) {}

    private async verificarReferenciasPropias(
        creadorId: number,
        proyectoId?: number | null,
        clienteId?: number | null,
    ): Promise<void> {
        const manager = this.transaccionRepository.manager;
        if (proyectoId != null) {
            const proyecto = await manager.findOne(Proyecto, { where: { id: proyectoId }, select: ['id', 'creadorId'] });
            if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
            if (proyecto.creadorId !== creadorId) {
                const miembro = await manager.findOne(ProyectoMiembro, { where: { proyectoId, usuarioId: creadorId } });
                if (!miembro || miembro.rol !== 'editor') {
                    throw new NotFoundException('Proyecto no encontrado');
                }
            }
        }
        if (clienteId != null) {
            const cliente = await manager.findOne(Cliente, { where: { id: clienteId, creadorId }, select: ['id'] });
            if (!cliente) throw new NotFoundException('Cliente no encontrado');
        }
    }

    async create(creadorId: number, dto: CrearTransaccionDto): Promise<Transaccion> {
        await this.verificarReferenciasPropias(creadorId, dto.proyectoId, dto.clienteId);
        const transaccion = this.transaccionRepository.create({ ...dto, creadorId });
        return this.transaccionRepository.save(transaccion);
    }

    async findAll(creadorId: number, pag?: PaginacionDto): Promise<Pagina<Transaccion>> {
        const { skip, take } = skipTake(pag ?? {});
        const [datos, total] = await this.transaccionRepository.findAndCount({
            where: { creadorId },
            order: { fecha: 'DESC', createdAt: 'DESC' },
            relations: ['proyecto', 'cliente'],
            skip,
            take,
        });
        return paginar(datos, total, pag ?? {});
    }

    async findOne(id: number, creadorId: number): Promise<Transaccion> {
        const transaccion = await this.transaccionRepository.findOne({
            where: { id, creadorId },
            relations: ['proyecto', 'cliente'],
        });

        if (!transaccion) {
            throw new NotFoundException('Transacción no encontrada');
        }

        return transaccion;
    }

    async update(id: number, creadorId: number, dto: ActualizarTransaccionDto): Promise<Transaccion> {
        const transaccion = await this.findOne(id, creadorId);
        await this.verificarReferenciasPropias(creadorId, dto.proyectoId, dto.clienteId);
        const { proyectoId, clienteId, ...resto } = dto;
        Object.assign(transaccion, resto);
        if (proyectoId !== undefined) transaccion.proyectoId = proyectoId;
        if (clienteId !== undefined) transaccion.clienteId = clienteId;
        return this.transaccionRepository.save(transaccion);
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const transaccion = await this.findOne(id, creadorId);
        await this.transaccionRepository.remove(transaccion);
    }

    async getResumen(creadorId: number, moneda?: string): Promise<{ totalIngresos: number; totalGastos: number; balance: number; ingresos: number; gastos: number; moneda: string }> {
        const transacciones = await this.transaccionRepository.find({ where: { creadorId } });
        const destino = (moneda || 'USD').toUpperCase();

        let ingresos = 0;
        let gastos = 0;
        for (const t of transacciones) {
            const monto = moneda ? await this.divisasService.convertir(Number(t.monto), t.moneda || 'USD', destino) : Number(t.monto);
            if (t.tipo === 'ingreso') ingresos += monto;
            else gastos += monto;
        }

        return {
            totalIngresos: ingresos,
            totalGastos: gastos,
            balance: ingresos - gastos,
            ingresos,
            gastos,
            moneda: moneda ? destino : 'mixta',
        };
    }
}
