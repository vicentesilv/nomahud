import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarea } from './entities/tarea.entity';
import { CrearTareaDto } from './dtos/crear-tarea.dto';
import { ActualizarTareaDto } from './dtos/actualizar-tarea.dto';
import { TiempoService } from '../tiempo/tiempo.service';
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { ProyectoMiembro } from '../proyectos/entities/proyecto-miembro.entity';
import { PaginacionDto, Pagina, paginar, skipTake } from '../common/dtos/paginacion.dto';

@Injectable()
export class TareasService {
    constructor(
        @InjectRepository(Tarea)
        private readonly tareaRepository: Repository<Tarea>,
        @Inject(forwardRef(() => TiempoService))
        private readonly tiempoService: TiempoService,
    ) {}

    /** Rol del usuario en el proyecto: propietario, editor, lector o null. */
    private async rolEnProyecto(proyectoId: number, usuarioId: number): Promise<'propietario' | 'editor' | 'lector' | null> {
        const manager = this.tareaRepository.manager;
        const proyecto = await manager.findOne(Proyecto, {
            where: { id: proyectoId },
            select: ['id', 'creadorId'],
        });
        if (!proyecto) return null;
        if (proyecto.creadorId === usuarioId) return 'propietario';
        const miembro = await manager.findOne(ProyectoMiembro, { where: { proyectoId, usuarioId } });
        return miembro ? miembro.rol : null;
    }

    private async verificarProyectoPropio(proyectoId: number, creadorId: number): Promise<Proyecto> {
        const rol = await this.rolEnProyecto(proyectoId, creadorId);
        if (!rol || (rol !== 'propietario' && rol !== 'editor')) {
            throw new NotFoundException('Proyecto no encontrado');
        }
        return { id: proyectoId } as Proyecto;
    }

    private async verificarLecturaProyecto(proyectoId: number, usuarioId: number): Promise<void> {
        const rol = await this.rolEnProyecto(proyectoId, usuarioId);
        if (!rol) {
            throw new NotFoundException('Proyecto no encontrado');
        }
    }

    async create(creadorId: number, dto: CrearTareaDto): Promise<Tarea> {
        await this.verificarProyectoPropio(dto.proyectoId, creadorId);
        const tarea = this.tareaRepository.create(dto);
        return this.tareaRepository.save(tarea);
    }

    async findAllByProyecto(proyectoId: number, creadorId: number): Promise<Tarea[]> {
        await this.verificarLecturaProyecto(proyectoId, creadorId);
        return this.tareaRepository.find({
            where: { proyectoId },
            order: { createdAt: 'ASC' },
            relations: ['asignadoA'],
        });
    }

    async findAll(userId: number, pag?: PaginacionDto): Promise<Pagina<Tarea>> {
        const { skip, take } = skipTake(pag ?? {});
        const [datos, total] = await this.tareaRepository.findAndCount({
            where: [{ proyecto: { creadorId: userId } }, { proyecto: { miembros: { usuarioId: userId } } }],
            relations: ['proyecto', 'asignadoA'],
            order: { createdAt: 'ASC' },
            skip,
            take,
        });
        return paginar(datos, total, pag ?? {});
    }

    async findOne(id: number, creadorId?: number): Promise<Tarea> {
        const tarea = await this.tareaRepository.findOne({
            where: { id },
            relations: ['asignadoA', 'proyecto'],
        });

        if (!tarea) {
            throw new NotFoundException('Tarea no encontrada');
        }

        if (creadorId != null) {
            const rol = await this.rolEnProyecto(tarea.proyectoId, creadorId);
            if (!rol) {
                throw new NotFoundException('Tarea no encontrada');
            }
        }

        return tarea;
    }

    async update(id: number, creadorId: number, dto: ActualizarTareaDto): Promise<Tarea> {
        const tarea = await this.findOne(id);
        const rol = await this.rolEnProyecto(tarea.proyectoId, creadorId);
        if (!rol || (rol !== 'propietario' && rol !== 'editor')) {
            throw new NotFoundException('Tarea no encontrada');
        }
        if (dto.proyectoId != null && dto.proyectoId !== tarea.proyectoId) {
            await this.verificarProyectoPropio(dto.proyectoId, creadorId);
        }
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
                    select: ['id', 'creadorId'],
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

    async remove(id: number, creadorId: number): Promise<void> {
        const tarea = await this.findOne(id);
        const rol = await this.rolEnProyecto(tarea.proyectoId, creadorId);
        if (!rol || (rol !== 'propietario' && rol !== 'editor')) {
            throw new NotFoundException('Tarea no encontrada');
        }
        await this.tareaRepository.remove(tarea);
    }
}
