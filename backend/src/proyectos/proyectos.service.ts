import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { ProyectoMiembro, RolMiembro } from './entities/proyecto-miembro.entity';
import { ProyectoInvitacion } from './entities/proyecto-invitacion.entity';
import { ProyectoComparticion } from './entities/proyecto-comparticion.entity';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { PaginacionDto, Pagina, paginar, skipTake } from '../common/dtos/paginacion.dto';
import { CrearProyectoDto } from './dtos/crear-proyecto.dto';
import { ActualizarProyectoDto } from './dtos/actualizar-proyecto.dto';
import { InvitarMiembroDto } from './dtos/invitar-miembro.dto';
import { FinanzasService } from '../finanzas/finanzas.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

export type RolProyecto = 'propietario' | RolMiembro;

@Injectable()
export class ProyectosService {
    constructor(
        @InjectRepository(Proyecto)
        private readonly proyectoRepository: Repository<Proyecto>,
        @InjectRepository(ProyectoMiembro)
        private readonly miembroRepository: Repository<ProyectoMiembro>,
        @InjectRepository(ProyectoInvitacion)
        private readonly invitacionRepository: Repository<ProyectoInvitacion>,
        @InjectRepository(ProyectoComparticion)
        private readonly comparticionRepository: Repository<ProyectoComparticion>,
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        @Inject(forwardRef(() => FinanzasService))
        private readonly finanzasService: FinanzasService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) {}

    /** Rol del usuario en el proyecto, o null si no tiene acceso. */
    async rolEnProyecto(usuarioId: number, proyectoId: number): Promise<RolProyecto | null> {
        const proyecto = await this.proyectoRepository.findOne({
            where: { id: proyectoId },
            select: ['id', 'creadorId'],
        });
        if (!proyecto) return null;
        if (proyecto.creadorId === usuarioId) return 'propietario';
        const miembro = await this.miembroRepository.findOne({ where: { proyectoId, usuarioId } });
        return miembro ? miembro.rol : null;
    }

    async create(creadorId: number, dto: CrearProyectoDto): Promise<Proyecto> {
        const proyecto = this.proyectoRepository.create({ ...dto, creadorId });
        return this.proyectoRepository.save(proyecto);
    }

    async findAll(creadorId: number, pag?: PaginacionDto): Promise<Pagina<Proyecto>> {
        const { skip, take } = skipTake(pag ?? {});
        const [datos, total] = await this.proyectoRepository.findAndCount({
            where: [{ creadorId }, { miembros: { usuarioId: creadorId } }],
            order: { updatedAt: 'DESC' },
            relations: ['tareas', 'clienteRel', 'miembros', 'miembros.usuario'],
            skip,
            take,
        });
        return paginar(datos, total, pag ?? {});
    }

    async findOne(id: number, creadorId: number): Promise<Proyecto> {
        const propio = await this.proyectoRepository.findOne({
            where: { id, creadorId },
            relations: ['tareas', 'clienteRel', 'miembros', 'miembros.usuario'],
        });
        if (propio) return propio;

        const rol = await this.rolEnProyecto(creadorId, id);
        if (!rol) throw new NotFoundException('Proyecto no encontrado');
        const proyecto = await this.proyectoRepository.findOne({
            where: { id },
            relations: ['tareas', 'clienteRel', 'miembros', 'miembros.usuario'],
        });
        if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
        return proyecto;
    }

    async update(id: number, creadorId: number, dto: ActualizarProyectoDto): Promise<Proyecto> {
        const proyecto = await this.findOne(id, creadorId);
        if (proyecto.creadorId !== creadorId) {
            throw new BadRequestException('Solo el propietario puede editar el proyecto');
        }
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
                moneda: proyectoActualizado.moneda || 'USD',
                descripcion: `Ganancia del proyecto: ${proyectoActualizado.nombre}`,
                fecha: new Date().toISOString().slice(0, 10),
                proyectoId: proyectoActualizado.id,
                clienteId: proyectoActualizado.clienteId ?? undefined,
            });
        }

        return proyectoActualizado;
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const proyecto = await this.proyectoRepository.findOne({ where: { id, creadorId } });
        if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
        await this.proyectoRepository.remove(proyecto);
    }

    async invitarMiembro(proyectoId: number, propietarioId: number, dto: InvitarMiembroDto): Promise<{ mensaje: string }> {
        const proyecto = await this.proyectoRepository.findOne({ where: { id: proyectoId, creadorId: propietarioId } });
        if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

        const email = dto.email.trim().toLowerCase();
        const invitado = await this.usuarioRepository.findOne({ where: { correo: email } });
        if (invitado && invitado.id === propietarioId) {
            throw new BadRequestException('Ya eres el propietario del proyecto');
        }
        if (invitado) {
            const existente = await this.miembroRepository.findOne({ where: { proyectoId, usuarioId: invitado.id } });
            if (existente) throw new BadRequestException('El usuario ya es miembro del proyecto');
        }

        await this.invitacionRepository.delete({ proyectoId, email });

        const token = crypto.randomBytes(32).toString('hex');
        const expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.invitacionRepository.save(
            this.invitacionRepository.create({
                proyectoId,
                email,
                rol: dto.rol,
                tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
                expiraEn,
                creadorId: propietarioId,
            }),
        );

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        await this.mailService.sendMail(
            email,
            `Te invitaron al proyecto ${proyecto.nombre}`,
            `<h1>Hola</h1><p>Te invitaron como <strong>{{rol}}</strong> al proyecto <strong>{{proyecto}}</strong>.</p><p><a href="{{enlace}}">Aceptar invitación</a></p><p>Expira en 7 días.</p>`,
            { rol: dto.rol, proyecto: proyecto.nombre, enlace: `${frontendUrl}/proyectos/invitacion?token=${token}` },
        );

        return { mensaje: `Invitación enviada a ${email}` };
    }

    async vistaPreviaInvitacion(token: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const invitacion = await this.invitacionRepository.findOne({
            where: { tokenHash },
            relations: ['proyecto'],
        });
        if (!invitacion) throw new BadRequestException('Invitación inválida');
        return {
            proyectoNombre: invitacion.proyecto?.nombre,
            email: invitacion.email,
            rol: invitacion.rol,
            expiraEn: invitacion.expiraEn,
            usada: !!invitacion.usadoEn,
            expirada: invitacion.expiraEn.getTime() < Date.now(),
        };
    }

    async aceptarInvitacion(token: string, usuarioId?: number): Promise<{ id: number; nombre: string }> {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const invitacion = await this.invitacionRepository.findOne({
            where: { tokenHash },
            relations: ['proyecto'],
        });
        if (!invitacion) throw new BadRequestException('Invitación inválida');
        if (invitacion.usadoEn) throw new BadRequestException('Invitación ya utilizada');
        if (invitacion.expiraEn.getTime() < Date.now()) throw new BadRequestException('Invitación expirada');

        let usuario: Usuario | null;
        if (usuarioId != null) {
            usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
            if (!usuario || usuario.correo.toLowerCase() !== invitacion.email.toLowerCase()) {
                throw new BadRequestException('La invitación corresponde a otro correo');
            }
        } else {
            usuario = await this.usuarioRepository.findOne({ where: { correo: invitacion.email } });
            if (!usuario) {
                throw new BadRequestException('Todavía no tenés cuenta con ese correo: registrate primero y volvé a este enlace');
            }
        }

        const existente = await this.miembroRepository.findOne({
            where: { proyectoId: invitacion.proyectoId, usuarioId: usuario.id },
        });
        if (!existente) {
            await this.miembroRepository.save(
                this.miembroRepository.create({ proyectoId: invitacion.proyectoId, usuarioId: usuario.id, rol: invitacion.rol }),
            );
        }
        invitacion.usadoEn = new Date();
        await this.invitacionRepository.save(invitacion);

        return { id: invitacion.proyectoId, nombre: invitacion.proyecto?.nombre };
    }

    async listarMiembros(proyectoId: number, solicitanteId: number) {
        const rol = await this.rolEnProyecto(solicitanteId, proyectoId);
        if (!rol) throw new NotFoundException('Proyecto no encontrado');
        const proyecto = await this.proyectoRepository.findOne({
            where: { id: proyectoId },
            relations: ['creador', 'miembros', 'miembros.usuario'],
        });
        if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
        return {
            propietario: { id: proyecto.creador.id, nombre: proyecto.creador.nombre, correo: proyecto.creador.correo },
            miembros: proyecto.miembros.map((m) => ({
                id: m.id,
                usuarioId: m.usuario.id,
                nombre: m.usuario.nombre,
                correo: m.usuario.correo,
                rol: m.rol,
            })),
        };
    }

    async cambiarRolMiembro(proyectoId: number, propietarioId: number, miembroUsuarioId: number, rol: RolMiembro): Promise<void> {
        const proyecto = await this.proyectoRepository.findOne({ where: { id: proyectoId, creadorId: propietarioId } });
        if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
        const miembro = await this.miembroRepository.findOne({ where: { proyectoId, usuarioId: miembroUsuarioId } });
        if (!miembro) throw new NotFoundException('Miembro no encontrado');
        miembro.rol = rol;
        await this.miembroRepository.save(miembro);
    }

    async expulsarMiembro(proyectoId: number, propietarioId: number, miembroUsuarioId: number): Promise<void> {
        const proyecto = await this.proyectoRepository.findOne({ where: { id: proyectoId, creadorId: propietarioId } });
        if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
        if (miembroUsuarioId === propietarioId) {
            throw new BadRequestException('El propietario no puede expulsarse a sí mismo');
        }
        const miembro = await this.miembroRepository.findOne({ where: { proyectoId, usuarioId: miembroUsuarioId } });
        if (!miembro) throw new NotFoundException('Miembro no encontrado');
        await this.miembroRepository.remove(miembro);
    }

    async crearLinkPublico(proyectoId: number, propietarioId: number): Promise<{ url: string }> {
        const proyecto = await this.proyectoRepository.findOne({ where: { id: proyectoId, creadorId: propietarioId } });
        if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

        const token = crypto.randomBytes(32).toString('hex');
        const expiraEn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.comparticionRepository.save(
            this.comparticionRepository.create({
                proyectoId,
                tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
                expiraEn,
            }),
        );

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        return { url: `${frontendUrl}/proyecto-publico?token=${token}` };
    }

    async obtenerPublicoPorToken(token: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const comparticion = await this.comparticionRepository.findOne({ where: { tokenHash } });
        if (!comparticion) throw new BadRequestException('Enlace inválido');
        if (comparticion.usadoEn) throw new BadRequestException('Enlace ya utilizado');
        if (comparticion.expiraEn.getTime() < Date.now()) throw new BadRequestException('Enlace expirado');

        const proyecto = await this.proyectoRepository.findOne({
            where: { id: comparticion.proyectoId },
            relations: ['tareas', 'clienteRel', 'creador'],
        });
        if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

        const tareas = proyecto.tareas || [];
        const completadas = tareas.filter((t) => t.estado === 'completada').length;
        const progreso = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0;

        return {
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion,
            estado: proyecto.estado,
            prioridad: proyecto.prioridad,
            cliente: proyecto.clienteRel?.nombre || proyecto.cliente,
            creador: proyecto.creador?.nombre,
            progreso,
            totalTareas: tareas.length,
            tareasCompletadas: completadas,
            tareas: tareas.map((t) => ({
                id: t.id,
                titulo: t.titulo,
                estado: t.estado,
                prioridad: t.prioridad,
                fechaVencimiento: t.fechaVencimiento,
            })),
            moneda: proyecto.moneda,
            ganancia: proyecto.ganancia,
            fechaInicio: proyecto.fechaInicio,
            fechaFin: proyecto.fechaFin,
        };
    }
}
