import { BadRequestException, UnauthorizedException, Injectable } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entitys/usuarios.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usuariosService: UsuariosService,
    ) {}

    private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    private generateToken(userId: number, correo: string): string {
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

        return this.jwtService.sign(
            { userId, correo },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: expiresIn as any,
            },
        );
    }

    async login(correo: string, contrasena: string): Promise<{ token: string; usuario: any }> {
        const usuario = await this.usuariosService.findByEmailWithPassword(correo);

        if (!usuario) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const usuarioConContrasena = usuario as Usuario & { contrasena?: string };

        if (!usuarioConContrasena.contrasena) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const passwordValido = await this.validatePassword(
            contrasena,
            usuarioConContrasena.contrasena,
        );

        if (!passwordValido) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const { contrasena: _, ...usuarioSinContrasena } = usuarioConContrasena;
        const token = this.generateToken(usuarioSinContrasena.id, usuarioSinContrasena.correo);

        return {
            token,
            usuario: usuarioSinContrasena,
        };
    }

    async register(
        nombre: string,
        correo: string,
        contrasena: string,
        ciudad?: string,
        fechaNacimiento?: Date,
    ): Promise<{ usuario: any }> {
        const usuarioExistente = await this.usuariosService.findByEmail(correo);

        if (usuarioExistente) {
            throw new BadRequestException('El usuario ya existe');
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        const usuarioCreado = await this.usuariosService.createUsuario({
            nombre,
            correo,
            contrasena: contrasenaHash,
            ciudad,
            fechaNacimiento,
        });

        return {
            usuario: usuarioCreado,
        };
    }
 
}
