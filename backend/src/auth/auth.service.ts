import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthToken } from './entitys/auth-token.entity';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usuariosService: UsuariosService,
        private readonly mailService: MailService,
        @InjectRepository(AuthToken)
        private readonly authTokenRepository: Repository<AuthToken>,
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
        const usuario = await this.usuariosService.findByEmail(correo);

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

        if (!usuarioConContrasena.emailVerificado) {
            throw new UnauthorizedException('Debes confirmar tu cuenta antes de iniciar sesión');
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

        await this.sendEmailConfirmation(usuarioCreado as Usuario);

        return {
            usuario: usuarioCreado,
        };
    }

    async confirmarCuenta(token: string): Promise<{ mensaje: string }> {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const authToken = await this.authTokenRepository.findOne({
            where: {
                tokenHash,
                tipo: 'confirmacion_email',
            },
        });

        if (!authToken) {
            throw new BadRequestException('Token inválido o expirado');
        }

        if (authToken.usadoEn) {
            throw new BadRequestException('Token ya utilizado');
        }

        if (authToken.expiraEn.getTime() < Date.now()) {
            throw new BadRequestException('Token expirado');
        }

        await this.usuariosService.marcarEmailVerificado(authToken.usuarioId);

        authToken.usadoEn = new Date();
        await this.authTokenRepository.save(authToken);

        return {
            mensaje: 'Cuenta confirmada correctamente',
        };
    }

    async reenviarConfirmacion(correo: string): Promise<{ mensaje: string }> {
        const usuario = await this.usuariosService.findByEmail(correo);

        if (!usuario) {
            throw new BadRequestException('Usuario no encontrado');
        }

        if (usuario.emailVerificado) {
            return {
                mensaje: 'La cuenta ya está confirmada',
            };
        }

        const ultimoToken = await this.authTokenRepository.findOne({
            where: {
                usuarioId: usuario.id,
                tipo: 'confirmacion_email',
            },
            order: {
                creadoEn: 'DESC',
            },
        });

        if (ultimoToken) {
            const segundosDesdeUltimoEnvio = (Date.now() - ultimoToken.creadoEn.getTime()) / 1000;

            if (segundosDesdeUltimoEnvio < 60) {
                throw new BadRequestException('Debes esperar 60 segundos antes de reenviar la confirmación');
            }
        }

        await this.sendEmailConfirmation(usuario as Usuario);

        return {
            mensaje: 'Correo de confirmación reenviado correctamente',
        };
    }

    async solicitarRecuperacion(correo: string): Promise<{ mensaje: string }> {
        const mensaje = 'Si el correo existe, se enviaron instrucciones';
        const usuario = await this.usuariosService.findByEmail(correo);

        if (!usuario) {
            return { mensaje };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiraEn = new Date(Date.now() + 60 * 60 * 1000);

        await this.authTokenRepository.save(
            this.authTokenRepository.create({
                usuarioId: usuario.id,
                tipo: 'recuperacion_password',
                tokenHash,
                expiraEn,
            }),
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const enlaceRecuperacion = `${frontendUrl}/restablecer-contrasena?token=${token}`;

        await this.mailService.sendMail(
            usuario.correo,
            'Recuperación de contraseña',
            `
                <h1>Recuperación de contraseña</h1>
                <p>Hola {{nombre}}, recibimos una solicitud para restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente enlace para continuar:</p>
                <p><a href="{{enlaceRecuperacion}}">Restablecer contraseña</a></p>
                <p>Este enlace vence en 1 hora.</p>
            `,
            {
                nombre: usuario.nombre,
                enlaceRecuperacion,
            },
        );

        return { mensaje };
    }

    private async sendEmailConfirmation(usuario: Usuario): Promise<void> {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.authTokenRepository.save(
            this.authTokenRepository.create({
                usuarioId: usuario.id,
                tipo: 'confirmacion_email',
                tokenHash,
                expiraEn,
            }),
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const enlaceConfirmacion = `${frontendUrl}/confirmar-cuenta?token=${token}`;

        await this.mailService.sendMail(
            usuario.correo,
            'Confirma tu cuenta',
            `
                <h1>Confirma tu cuenta</h1>
                <p>Hola {{nombre}}, gracias por registrarte.</p>
                <p>Haz clic en el siguiente enlace para activar tu cuenta:</p>
                <p><a href="{{enlaceConfirmacion}}">Confirmar cuenta</a></p>
                <p>Este enlace vence en 24 horas.</p>
            `,
            {
                nombre: usuario.nombre,
                enlaceConfirmacion,
            },
        );
    }
 
}
