import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entitys/usuarios.entity';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from './dtos/create.usuario.dto';
import { UpdateUsuarioDto } from './dtos/update.usuario.dto';
import { EstadoCuenta, RolUsuario } from './entitys/usuarios.entity';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario) private readonly usuariosRepository: Repository<Usuario>,
        
    ){}

    private normalizarCorreo(correo: string): string {
        return (correo ?? '').trim().toLowerCase();
    }

    async createUsuario(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        const usuario = this.usuariosRepository.create({
            ...createUsuarioDto,
            correo: this.normalizarCorreo(createUsuarioDto.correo),
        });

        const usuarioCreado = await this.usuariosRepository.save(usuario);
        const { contrasena: _, ...usuarioSinContrasena } = usuarioCreado as Usuario & {
            contrasena?: string;
        };
        return usuarioSinContrasena as Usuario;
    }

    async findByEmail(correo: string): Promise<Usuario | null> {
        return this.usuariosRepository.findOne({
            where: { correo: this.normalizarCorreo(correo) },
        });
    }

    async findByEmailWithPassword(correo: string): Promise<Usuario | null> {
        return this.usuariosRepository
            .createQueryBuilder('usuario')
            .addSelect('usuario.contrasena')
            .where('usuario.correo = :correo', { correo: this.normalizarCorreo(correo) })
            .getOne();
    }

    async findById(id: number): Promise<Usuario | null> {
        return this.usuariosRepository.findOne({
            where: { id },
        });
    }

    async updateUsuario(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
        const usuario = await this.findById(id);

        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        const dto = updateUsuarioDto as Record<string, unknown>;
        if (dto.correo !== undefined || dto.fechaNacimiento !== undefined || (dto as Record<string, unknown>).contrasena !== undefined) {
            throw new BadRequestException('No se permite actualizar correo, fechaNacimiento ni contrasena por esta vía');
        }

        if (updateUsuarioDto.nombre !== undefined) usuario.nombre = updateUsuarioDto.nombre;
        if (updateUsuarioDto.ciudad !== undefined) usuario.ciudad = updateUsuarioDto.ciudad;
        
        const usuarioActualizado = await this.usuariosRepository.save(usuario);
        const { contrasena: _, ...usuarioSinContrasena } = usuarioActualizado as Usuario & { contrasena?: string };
        return usuarioSinContrasena as Usuario;
    }

    async deleteUsuario(id: number): Promise<void> {
        const usuario = await this.findById(id);
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        await this.usuariosRepository.remove(usuario);
    }

    async marcarEmailVerificado(id: number): Promise<Usuario> {
        const usuario = await this.findById(id);

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        usuario.emailVerificado = true;
        usuario.emailVerificadoAt = new Date();
        usuario.estadoCuenta = 'activa' as EstadoCuenta;

        const usuarioActualizado = await this.usuariosRepository.save(usuario);
        const { contrasena: _, ...usuarioSinContrasena } = usuarioActualizado as Usuario & {
            contrasena?: string;
        };

        return usuarioSinContrasena as Usuario;
    }

    async marcarInvitadoVerificado(id: number): Promise<Usuario> {
        const usuario = await this.findById(id);
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }
        usuario.rol = 'invitado';
        usuario.emailVerificado = true;
        usuario.emailVerificadoAt = new Date();
        usuario.estadoCuenta = 'activa' as EstadoCuenta;

        const actualizado = await this.usuariosRepository.save(usuario);
        const { contrasena: _, ...sinContrasena } = actualizado as Usuario & { contrasena?: string };
        return sinContrasena as Usuario;
    }

    async cambiarRol(id: number, rol: RolUsuario): Promise<Usuario> {
        const usuario = await this.findById(id);
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }
        usuario.rol = rol;
        const actualizado = await this.usuariosRepository.save(usuario);
        const { contrasena: _, ...sinContrasena } = actualizado as Usuario & { contrasena?: string };
        return sinContrasena as Usuario;
    }

    async cambiarContrasena(id: number, contrasenaHash: string): Promise<void> {
        const resultado = await this.usuariosRepository.update(id, {
            contrasena: contrasenaHash,
        });

        if (!resultado.affected) {
            throw new NotFoundException('Usuario no encontrado');
        }
    }
    

}
