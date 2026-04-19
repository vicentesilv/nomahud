import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './usuarios.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario) private readonly usuariosRepository: Repository<Usuario>,
        
    ){}

    async createUsuario(
        nombre: string,
        correo: string,
        contrasena: string,
        ciudad?: string,
        fechaNacimiento?: Date,
    ): Promise<Usuario> {
        const usuario = this.usuariosRepository.create({
            nombre,
            correo,
            contrasena,
            ciudad,
            fechaNacimiento,
        });

        const usuarioCreado = await this.usuariosRepository.save(usuario);
        const { contrasena: _, ...usuarioSinContrasena } = usuarioCreado as Usuario & {
            contrasena?: string;
        };

        return usuarioSinContrasena as Usuario;
    }


}
