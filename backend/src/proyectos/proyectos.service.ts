import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { CrearProyectoDto } from './dtos/crear-proyecto.dto';
import { ActualizarProyectoDto } from './dtos/actualizar-proyecto.dto';

@Injectable()
export class ProyectosService {
    constructor(
        @InjectRepository(Proyecto)
        private readonly proyectoRepository: Repository<Proyecto>,
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
        Object.assign(proyecto, dto);
        return this.proyectoRepository.save(proyecto);
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const proyecto = await this.findOne(id, creadorId);
        await this.proyectoRepository.remove(proyecto);
    }
}
