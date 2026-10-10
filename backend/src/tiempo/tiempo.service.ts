import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroTiempo } from './entities/registro-tiempo.entity';
import { CrearRegistroTiempoDto } from './dtos/crear-registro-tiempo.dto';
import { ActualizarRegistroTiempoDto } from './dtos/actualizar-registro-tiempo.dto';
import { PaginacionDto, Pagina, paginar, skipTake } from '../common/dtos/paginacion.dto';
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { ProyectoMiembro } from '../proyectos/entities/proyecto-miembro.entity';
import { Tarea } from '../tareas/entities/tarea.entity';

@Injectable()
export class TiempoService {
    constructor(
        @InjectRepository(RegistroTiempo)
        private readonly registroRepository: Repository<RegistroTiempo>,
    ) {}

    private async puedeEscribirProyecto(creadorId: number, proyectoId: number): Promise<boolean> {
        const manager = this.registroRepository.manager;
        const proyecto = await manager.findOne(Proyecto, { where: { id: proyectoId }, select: ['id', 'creadorId'] });
        if (!proyecto) return false;
        if (proyecto.creadorId === creadorId) return true;
        const miembro = await manager.findOne(ProyectoMiembro, { where: { proyectoId, usuarioId: creadorId } });
        return !!miembro && miembro.rol === 'editor';
    }

    private async verificarReferenciasPropias(creadorId: number, proyectoId?: number | null, tareaId?: number | null): Promise<void> {
        const manager = this.registroRepository.manager;
        if (proyectoId != null) {
            if (!(await this.puedeEscribirProyecto(creadorId, proyectoId))) {
                throw new NotFoundException('Proyecto no encontrado');
            }
        }
        if (tareaId != null) {
            const tarea = await manager.findOne(Tarea, {
                where: { id: tareaId },
                relations: ['proyecto'],
            });
            if (!tarea) throw new NotFoundException('Tarea no encontrada');
            if (!(await this.puedeEscribirProyecto(creadorId, tarea.proyectoId))) {
                throw new NotFoundException('Tarea no encontrada');
            }
        }
    }

    async create(creadorId: number, dto: CrearRegistroTiempoDto): Promise<RegistroTiempo> {
        await this.verificarReferenciasPropias(creadorId, dto.proyectoId, dto.tareaId);
        const registro = this.registroRepository.create({ ...dto, creadorId });
        return this.registroRepository.save(registro);
    }

    async findAll(creadorId: number, pag?: PaginacionDto): Promise<Pagina<RegistroTiempo>> {
        const { skip, take } = skipTake(pag ?? {});
        const [datos, total] = await this.registroRepository.findAndCount({
            where: { creadorId },
            order: { fecha: 'DESC', createdAt: 'DESC' },
            relations: ['proyecto', 'tarea'],
            skip,
            take,
        });
        return paginar(datos, total, pag ?? {});
    }

    async findOne(id: number, creadorId: number): Promise<RegistroTiempo> {
        const registro = await this.registroRepository.findOne({
            where: { id, creadorId },
            relations: ['proyecto', 'tarea'],
        });

        if (!registro) {
            throw new NotFoundException('Registro no encontrado');
        }

        return registro;
    }

    async update(id: number, creadorId: number, dto: ActualizarRegistroTiempoDto): Promise<RegistroTiempo> {
        const registro = await this.findOne(id, creadorId);
        await this.verificarReferenciasPropias(creadorId, dto.proyectoId, dto.tareaId);
        const { proyectoId, tareaId, ...resto } = dto;
        Object.assign(registro, resto);
        if (proyectoId !== undefined) registro.proyectoId = proyectoId;
        if (tareaId !== undefined) registro.tareaId = tareaId;
        return this.registroRepository.save(registro);
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const registro = await this.findOne(id, creadorId);
        await this.registroRepository.remove(registro);
    }

    async getResumen(creadorId: number): Promise<{ totalHoras: number; registrosHoy: number }> {
        const registros = await this.registroRepository.find({ where: { creadorId } });

        const totalHoras = registros.reduce((sum, r) => sum + Number(r.horas), 0);
        const hoy = new Date().toISOString().slice(0, 10);
        const registrosHoy = registros.filter((r) => r.fecha === hoy).length;

        return { totalHoras, registrosHoy };
    }
}
