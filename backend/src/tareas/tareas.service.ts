import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarea } from './entities/tarea.entity';
import { CrearTareaDto } from './dtos/crear-tarea.dto';
import { ActualizarTareaDto } from './dtos/actualizar-tarea.dto';

@Injectable()
export class TareasService {
    constructor(
        @InjectRepository(Tarea)
        private readonly tareaRepository: Repository<Tarea>,
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
        Object.assign(tarea, dto);
        return this.tareaRepository.save(tarea);
    }

    async remove(id: number): Promise<void> {
        const tarea = await this.findOne(id);
        await this.tareaRepository.remove(tarea);
    }
}
