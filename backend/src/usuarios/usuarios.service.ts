import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './usuarios.entity';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from './dtos/create.usuario.dto';

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

    async findById(id: number): Promise<Usuario | null> {
        return this.usuariosRepository.findOne({
            where: { id },
        });
    }

}
