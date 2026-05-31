import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { CrearProyectoDto } from './dtos/crear-proyecto.dto';
import { ActualizarProyectoDto } from './dtos/actualizar-proyecto.dto';
import { FinanzasService } from '../finanzas/finanzas.service';

@Injectable()
export class ProyectosService {
    constructor(
        @InjectRepository(Proyecto)
        private readonly proyectoRepository: Repository<Proyecto>,
        @Inject(forwardRef(() => FinanzasService))
        private readonly finanzasService: FinanzasService,
    ) {}

    async create(creadorId: number, dto: CrearProyectoDto): Promise<Proyecto> {
        const proyecto = this.proyectoRepository.create({ ...dto, creadorId });
        return this.proyectoRepository.save(proyecto);
    }

    async findAll(creadorId: number): Promise<Proyecto[]> {
        return this.proyectoRepository.find({
            where: { creadorId },
            order: { updatedAt: 'DESC' },
            relations: ['tareas', 'clienteRel'],
        });
    }

    async findOne(id: number, creadorId: number): Promise<Proyecto> {
        const proyecto = await this.proyectoRepository.findOne({
            where: { id, creadorId },
            relations: ['tareas', 'clienteRel'],
        });

        if (!proyecto) {
            throw new NotFoundException('Proyecto no encontrado');
        }

        return proyecto;
    }

    async update(id: number, creadorId: number, dto: ActualizarProyectoDto): Promise<Proyecto> {
        const proyecto = await this.findOne(id, creadorId);
        const estadoAnterior = proyecto.estado;
        Object.assign(proyecto, dto);

        const proyectoActualizado = await this.proyectoRepository.save(proyecto);

        if (
            estadoAnterior !== 'completado' &&
            proyectoActualizado.estado === 'completado' &&
            proyectoActualizado.ganancia &&
            Number(proyectoActualizado.ganancia) > 0
        ) {
            await this.finanzasService.create(creadorId, {
                tipo: 'ingreso',
                categoria: 'Desarrollo',
                monto: Number(proyectoActualizado.ganancia),
                moneda: 'USD',
                descripcion: `Ganancia del proyecto: ${proyectoActualizado.nombre}`,
                fecha: new Date().toISOString().slice(0, 10),
                proyectoId: proyectoActualizado.id,
                clienteId: proyectoActualizado.clienteId ?? undefined,
            });
        }

        return proyectoActualizado;
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const proyecto = await this.findOne(id, creadorId);
        await this.proyectoRepository.remove(proyecto);
    }
}
