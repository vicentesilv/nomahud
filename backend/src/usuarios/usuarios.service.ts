import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entitys/usuarios.entity';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from './dtos/create.usuario.dto';
import { UpdateUsuarioDto } from './dtos/update.usuario.dto';
import { EstadoCuenta } from './entitys/usuarios.entity';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario) private readonly usuariosRepository: Repository<Usuario>,
        
    ){}

    async createUsuario(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        const usuario = this.usuariosRepository.create(createUsuarioDto);

        const usuarioCreado = await this.usuariosRepository.save(usuario);
        const { contrasena: _, ...usuarioSinContrasena } = usuarioCreado as Usuario & {
            contrasena?: string;
        };
        return usuarioSinContrasena as Usuario;
    }

    async findByEmail(correo: string): Promise<Usuario | null> {
        return this.usuariosRepository.findOne({
            where: { correo },
        });
    }

    async findByEmailWithPassword(correo: string): Promise<Usuario | null> {
        return this.usuariosRepository
            .createQueryBuilder('usuario')
            .addSelect('usuario.contrasena')
            .where('usuario.correo = :correo', { correo })
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
        if ( updateUsuarioDto.correo !== undefined || updateUsuarioDto.fechaNacimiento !== undefined) {
            throw new BadRequestException('No se permite actualizar correo ni fechaNacimiento');
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

    async cambiarContrasena(id: number, contrasenaHash: string): Promise<void> {
        const resultado = await this.usuariosRepository.update(id, {
            contrasena: contrasenaHash,
        });

        if (!resultado.affected) {
            throw new NotFoundException('Usuario no encontrado');
        }
    }
    

}
