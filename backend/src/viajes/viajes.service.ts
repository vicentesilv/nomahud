import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Viaje } from './entities/viaje.entity';
import { ItinerarioItem } from './entities/itinerario-item.entity';
import { CrearViajeDto } from './dtos/crear-viaje.dto';
import { ActualizarViajeDto } from './dtos/actualizar-viaje.dto';
import { FinanzasService } from '../finanzas/finanzas.service';

@Injectable()
export class ViajesService {
    constructor(
        @InjectRepository(Viaje)
        private readonly viajeRepository: Repository<Viaje>,
        @InjectRepository(ItinerarioItem)
        private readonly itinerarioRepository: Repository<ItinerarioItem>,
        @Inject(forwardRef(() => FinanzasService))
        private readonly finanzasService: FinanzasService,
    ) {}

    private validarFechas(fechaInicio: string, fechaFin?: string | null): void {
        if (!fechaFin) return;
        if (fechaInicio > fechaFin) {
            throw new BadRequestException(
                'La fecha de inicio no puede ser posterior a la fecha de fin.'
            );
        }
    }

    private async validarPresupuesto(creadorId: number, presupuesto: number | undefined | null, _moneda: string): Promise<void> {
        if (presupuesto == null || presupuesto <= 0) return;
        const resumen = await this.finanzasService.getResumen(creadorId);
        if (presupuesto > resumen.balance) {
            throw new BadRequestException(
                `El presupuesto (${Number(presupuesto).toLocaleString('es-MX')}) supera el balance disponible (${Number(resumen.balance).toLocaleString('es-MX')}). Ingresa más fondos o reduce el presupuesto.`
            );
        }
    }

    private async validarCostoItinerario(viajeId: number, nuevoCosto: number, excluirItemId?: number): Promise<void> {
        const viaje = await this.viajeRepository.findOne({ where: { id: viajeId } });
        if (!viaje || viaje.presupuesto == null || viaje.presupuesto <= 0) return;

        const items = await this.itinerarioRepository.find({ where: { viajeId } });
        let totalCostos = items.reduce((sum, item) => {
            if (excluirItemId != null && item.id === excluirItemId) return sum;
            return sum + Number(item.costo || 0);
        }, 0);
        totalCostos += nuevoCosto;

        if (totalCostos > Number(viaje.presupuesto)) {
            throw new BadRequestException(
                `El costo total del itinerario (${Number(totalCostos).toLocaleString('es-MX')}) supera el presupuesto del viaje (${Number(viaje.presupuesto).toLocaleString('es-MX')}). Reduce costos o aumenta el presupuesto.`
            );
        }
    }

    async create(creadorId: number, dto: CrearViajeDto): Promise<Viaje> {
        this.validarFechas(dto.fechaInicio, dto.fechaFin);
        if (dto.presupuesto != null) {
            await this.validarPresupuesto(creadorId, dto.presupuesto, dto.moneda || 'MXN');
        }
        const viaje = this.viajeRepository.create(dto as Viaje);
        (viaje as any).creadorId = creadorId;
        return this.viajeRepository.save(viaje);
    }

    async findAll(creadorId: number): Promise<Viaje[]> {
        return this.viajeRepository.find({
            where: { creadorId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number, creadorId: number): Promise<Viaje> {
        const viaje = await this.viajeRepository.findOne({
            where: { id, creadorId },
            relations: ['itinerario'],
            order: { itinerario: { orden: 'ASC' } },
        });

        if (!viaje) {
            throw new NotFoundException('Viaje no encontrado');
        }

        return viaje;
    }

    async update(id: number, creadorId: number, dto: ActualizarViajeDto): Promise<Viaje> {
        const viaje = await this.viajeRepository.findOne({ where: { id, creadorId } });
        if (!viaje) throw new NotFoundException('Viaje no encontrado');

        const estadoAnterior = viaje.estado;
        const presupuestoAnterior = viaje.presupuesto;
        const fechaInicio = dto.fechaInicio || viaje.fechaInicio;
        const fechaFin = dto.fechaFin !== undefined ? dto.fechaFin : viaje.fechaFin;
        this.validarFechas(fechaInicio, fechaFin);

        if (dto.presupuesto != null && dto.presupuesto > (presupuestoAnterior || 0)) {
            await this.validarPresupuesto(creadorId, dto.presupuesto, dto.moneda || viaje.moneda);
        }

        Object.assign(viaje, dto);
        const viajeActualizado = await this.viajeRepository.save(viaje);

        if (
            estadoAnterior !== 'completado' &&
            viajeActualizado.estado === 'completado' &&
            viajeActualizado.presupuesto != null &&
            viajeActualizado.presupuesto > 0 &&
            !viajeActualizado.autoGastoRegistrado
        ) {
            await this.finanzasService.create(creadorId, {
                tipo: 'gasto',
                categoria: 'Viaje',
                monto: viajeActualizado.presupuesto,
                moneda: viajeActualizado.moneda || 'MXN',
                descripcion: `Gasto de viaje: ${viajeActualizado.destino}`,
                fecha: new Date().toISOString().slice(0, 10),
            });
            viajeActualizado.autoGastoRegistrado = true;
            return this.viajeRepository.save(viajeActualizado);
        }

        return viajeActualizado;
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const viaje = await this.viajeRepository.findOne({ where: { id, creadorId } });
        if (!viaje) throw new NotFoundException('Viaje no encontrado');
        await this.viajeRepository.remove(viaje);
    }

    private validarFechaEnRango(viaje: Viaje, fecha?: string | null): void {
        if (!fecha) return;
        if (viaje.fechaInicio && fecha < viaje.fechaInicio) {
            throw new BadRequestException('La fecha no entra en el rango del viaje');
        }
        if (viaje.fechaFin && fecha > viaje.fechaFin) {
            throw new BadRequestException('La fecha no entra en el rango del viaje');
        }
    }

    async createItinerarioItem(viajeId: number, creadorId: number, data: { lugar: string; fecha?: string; descripcion?: string; costo?: number; orden?: number }): Promise<ItinerarioItem> {
        const viaje = await this.findOne(viajeId, creadorId);
        this.validarFechaEnRango(viaje, data.fecha);
        if (data.costo != null && data.costo > 0) {
            await this.validarCostoItinerario(viajeId, data.costo);
        }
        const item = this.itinerarioRepository.create({ ...data, viajeId });
        return this.itinerarioRepository.save(item);
    }

    async updateItinerarioItem(itemId: number, viajeId: number, creadorId: number, data: Partial<{ lugar: string; fecha: string; descripcion: string; costo: number; orden: number }>): Promise<ItinerarioItem> {
        const viaje = await this.findOne(viajeId, creadorId);
        const item = await this.itinerarioRepository.findOne({ where: { id: itemId, viajeId } });
        if (!item) throw new NotFoundException('Item de itinerario no encontrado');

        this.validarFechaEnRango(viaje, data.fecha);

        const nuevoCosto = data.costo != null ? data.costo : Number(item.costo || 0);
        if (nuevoCosto > 0) {
            await this.validarCostoItinerario(viajeId, nuevoCosto, itemId);
        }

        Object.assign(item, data);
        return this.itinerarioRepository.save(item);
    }

    async removeItinerarioItem(itemId: number, viajeId: number, creadorId: number): Promise<void> {
        await this.findOne(viajeId, creadorId);
        const item = await this.itinerarioRepository.findOne({ where: { id: itemId, viajeId } });
        if (!item) throw new NotFoundException('Item de itinerario no encontrado');
        await this.itinerarioRepository.remove(item);
    }
}
