import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarea } from './entities/tarea.entity';
import { CrearTareaDto } from './dtos/crear-tarea.dto';
import { ActualizarTareaDto } from './dtos/actualizar-tarea.dto';
import { TiempoService } from '../tiempo/tiempo.service';
import { Proyecto } from '../proyectos/entities/proyecto.entity';

@Injectable()
export class TareasService {
    constructor(
        @InjectRepository(Tarea)
        private readonly tareaRepository: Repository<Tarea>,
        @Inject(forwardRef(() => TiempoService))
        private readonly tiempoService: TiempoService,
    ) {}

    async create(dto: CrearTareaDto): Promise<Tarea> {
        const tarea = this.tareaRepository.create(dto);
        return this.tareaRepository.save(tarea);
    }

    async findAllByProyecto(proyectoId: number): Promise<Tarea[]> {
        return this.tareaRepository.find({
            where: { proyectoId },
            order: { createdAt: 'ASC' },
            relations: ['asignadoA'],
        });
    }

    async findOne(id: number): Promise<Tarea> {
        const tarea = await this.tareaRepository.findOne({
            where: { id },
            relations: ['asignadoA'],
        });

        if (!tarea) {
            throw new NotFoundException('Tarea no encontrada');
        }

        return tarea;
    }

    async update(id: number, dto: ActualizarTareaDto): Promise<Tarea> {
        const tarea = await this.findOne(id);
        const estadoAnterior = tarea.estado;
        const proyectoId = tarea.proyectoId;
        const estimacionHoras = tarea.estimacionHoras;
        const titulo = tarea.titulo;

        Object.assign(tarea, dto);

        if (
            estadoAnterior !== 'completada' &&
            tarea.estado === 'completada' &&
            proyectoId &&
            !tarea.autoTiempoRegistrado
        ) {
            const horas = estimacionHoras ?? 1;
            if (horas > 0) {
                const proyecto = await this.tareaRepository.manager.findOne(Proyecto, {
                    where: { id: proyectoId },
                    select: ['creadorId'],
                });
                if (proyecto?.creadorId) {
                    await this.tiempoService.create(proyecto.creadorId, {
                        proyectoId,
                        tareaId: tarea.id,
                        horas,
                        fecha: new Date().toISOString().slice(0, 10),
                        descripcion: `Tarea completada: ${titulo}`,
                    });
                }
            }
            tarea.autoTiempoRegistrado = true;
        }

        return this.tareaRepository.save(tarea);
    }

    async remove(id: number): Promise<void> {
        const tarea = await this.findOne(id);
        await this.tareaRepository.remove(tarea);
    }
}
