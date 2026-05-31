import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaccion } from './entities/transaccion.entity';
import { CrearTransaccionDto } from './dtos/crear-transaccion.dto';
import { ActualizarTransaccionDto } from './dtos/actualizar-transaccion.dto';

@Injectable()
export class FinanzasService {
    constructor(
        @InjectRepository(Transaccion)
        private readonly transaccionRepository: Repository<Transaccion>,
    ) {}

    async create(creadorId: number, dto: CrearTransaccionDto): Promise<Transaccion> {
        const transaccion = this.transaccionRepository.create({ ...dto, creadorId });
        return this.transaccionRepository.save(transaccion);
    }

    async findAll(creadorId: number): Promise<Transaccion[]> {
        return this.transaccionRepository.find({
            where: { creadorId },
            order: { fecha: 'DESC', createdAt: 'DESC' },
            relations: ['proyecto', 'cliente'],
        });
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
        Object.assign(transaccion, dto);
        return this.transaccionRepository.save(transaccion);
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const transaccion = await this.findOne(id, creadorId);
        await this.transaccionRepository.remove(transaccion);
    }

    async getResumen(creadorId: number): Promise<{ totalIngresos: number; totalGastos: number; balance: number; ingresos: number; gastos: number }> {
        const transacciones = await this.transaccionRepository.find({ where: { creadorId } });

        const ingresos = transacciones
            .filter((t) => t.tipo === 'ingreso')
            .reduce((sum, t) => sum + Number(t.monto), 0);

        const gastos = transacciones
            .filter((t) => t.tipo === 'gasto')
            .reduce((sum, t) => sum + Number(t.monto), 0);

        return {
            totalIngresos: ingresos,
            totalGastos: gastos,
            balance: ingresos - gastos,
            ingresos,
            gastos,
        };
    }
}
