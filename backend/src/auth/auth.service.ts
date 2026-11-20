import { BadRequestException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PerfilesService } from '../perfiles/perfiles.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthToken } from './entitys/auth-token.entity';
import { RefreshToken } from './entitys/refresh-token.entity';
import { ProyectoInvitacion } from '../proyectos/entities/proyecto-invitacion.entity';
import { ProyectoMiembro } from '../proyectos/entities/proyecto-miembro.entity';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly mailMetrics = {
        enviados: 0,
        fallidos: 0,
        omitidos: 0,
    };

    constructor(
        private readonly jwtService: JwtService,
        private readonly usuariosService: UsuariosService,
        private readonly perfilesService: PerfilesService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        @InjectRepository(AuthToken)
        private readonly authTokenRepository: Repository<AuthToken>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        @InjectRepository(ProyectoInvitacion)
        private readonly invitacionRepository: Repository<ProyectoInvitacion>,
        @InjectRepository(ProyectoMiembro)
        private readonly miembroRepository: Repository<ProyectoMiembro>,
    ) {}

    private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    private generateToken(userId: number, correo: string): string {
        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';
        const secret = this.configService.getOrThrow<string>('JWT_SECRET');

        return this.jwtService.sign(
            { userId, correo },
            {
                secret,
                expiresIn: expiresIn as never,
            },
        );
    }

    private async emitirRefreshToken(usuarioId: number): Promise<string> {
        const token = crypto.randomBytes(48).toString('hex');
        const expiraEn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.refreshTokenRepository.save(
            this.refreshTokenRepository.create({
                usuarioId,
                tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
                expiraEn,
            }),
        );
        return token;
    }

    async renovar(refreshToken: string): Promise<{ token: string; refreshToken: string; usuario: any }> {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const guardado = await this.refreshTokenRepository.findOne({ where: { tokenHash } });
        if (!guardado || guardado.revocadoEn || guardado.expiraEn.getTime() < Date.now()) {
            throw new UnauthorizedException('Sesión expirada, volvé a iniciar sesión');
        }
        const usuario = await this.usuariosService.findById(guardado.usuarioId);
        if (!usuario || !usuario.emailVerificado || usuario.estadoCuenta !== 'activa') {
            throw new UnauthorizedException('Cuenta no activa');
        }

        guardado.revocadoEn = new Date();
        await this.refreshTokenRepository.save(guardado);

        const { contrasena: _, ...usuarioSinContrasena } = usuario as Usuario & { contrasena?: string };
        return {
            token: this.generateToken(usuario.id, usuario.correo),
            refreshToken: await this.emitirRefreshToken(usuario.id),
            usuario: usuarioSinContrasena,
        };
    }

    async cerrarSesion(refreshToken: string, usuarioId: number): Promise<{ mensaje: string }> {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const guardado = await this.refreshTokenRepository.findOne({ where: { tokenHash, usuarioId } });
        if (guardado && !guardado.revocadoEn) {
            guardado.revocadoEn = new Date();
            await this.refreshTokenRepository.save(guardado);
        }
        return { mensaje: 'Sesión cerrada correctamente' };
    }

    async login(correo: string, contrasena: string): Promise<{ token: string; refreshToken: string; usuario: any }> {
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

        if (!usuarioConContrasena.emailVerificado || usuarioConContrasena.estadoCuenta !== 'activa') {
            throw new UnauthorizedException('Debes confirmar tu cuenta antes de iniciar sesión');
        }

        const { contrasena: _, ...usuarioSinContrasena } = usuarioConContrasena;
        const token = this.generateToken(usuarioSinContrasena.id, usuarioSinContrasena.correo);

        return {
            token,
            refreshToken: await this.emitirRefreshToken(usuarioSinContrasena.id),
            usuario: usuarioSinContrasena,
        };
    }

    private googleConfig(): { clientId: string; clientSecret: string; callbackUrl: string } {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
        if (!clientId || !clientSecret) {
            throw new ServiceUnavailableException('El inicio de sesión con Google no está configurado');
        }

        const backendUrl = this.configService.get<string>('BACKEND_URL')?.trim() || 'http://localhost:3001';
        const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL')?.trim()
            || `${backendUrl.replace(/\/$/, '')}/auth/google/callback`;
        return { clientId, clientSecret, callbackUrl };
    }

    getGoogleAuthorizationUrl(state: string): string {
        const { clientId, callbackUrl } = this.googleConfig();
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            prompt: 'select_account',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    async loginWithGoogle(code: string): Promise<{ token: string; refreshToken: string; usuario: any }> {
        const { clientId, clientSecret, callbackUrl } = this.googleConfig();
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: callbackUrl,
                grant_type: 'authorization_code',
            }).toString(),
        });
        const tokenData = await tokenResponse.json() as { access_token?: string };
        if (!tokenResponse.ok || !tokenData.access_token) {
            throw new UnauthorizedException('Google no pudo validar la autorización');
        }

        const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileResponse.json() as {
            sub?: string;
            email?: string;
            email_verified?: boolean;
            name?: string;
        };
        if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
            throw new UnauthorizedException('La cuenta de Google no tiene un correo verificado');
        }

        const correo = profile.email.trim().toLowerCase();
        let usuario = await this.usuariosService.findByGoogleId(profile.sub);
        if (!usuario) {
            usuario = await this.usuariosService.findByEmail(correo);
            if (usuario?.googleId && usuario.googleId !== profile.sub) {
                throw new BadRequestException('El correo ya está vinculado a otra cuenta de Google');
            }
        }

        if (!usuario) {
            const contrasena = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            const creado = await this.usuariosService.createUsuario({
                nombre: (profile.name || correo.split('@')[0]).slice(0, 150),
                correo,
                contrasena,
            });
            await this.usuariosService.marcarEmailVerificado(creado.id);
            await this.usuariosService.asociarGoogle(creado.id, profile.sub);
            await this.perfilesService.findOrCreate(creado.id);
            usuario = await this.usuariosService.findById(creado.id);
        } else {
            if (usuario.estadoCuenta === 'bloqueada') {
                throw new UnauthorizedException('La cuenta está bloqueada');
            }
            if (!usuario.emailVerificado || usuario.estadoCuenta !== 'activa') {
                await this.usuariosService.marcarEmailVerificado(usuario.id);
            }
            if (!usuario.googleId) {
                await this.usuariosService.asociarGoogle(usuario.id, profile.sub);
            }
            usuario = await this.usuariosService.findById(usuario.id);
        }

        if (!usuario) throw new UnauthorizedException('No se pudo crear la cuenta');
        const { contrasena: _, googleId: __, ...usuarioSinCredenciales } = usuario as Usuario & { contrasena?: string; googleId?: string | null };
        return {
            token: this.generateToken(usuario.id, usuario.correo),
            refreshToken: await this.emitirRefreshToken(usuario.id),
            usuario: usuarioSinCredenciales,
        };
    }

    async register(
        nombre: string,
        correo: string,
        contrasena: string,
        ciudad?: string,
        fechaNacimiento?: Date,
        invitacionToken?: string,
    ): Promise<{ usuario: any; token?: string; refreshToken?: string; advertencia?: string }> {
        const usuarioExistente = await this.usuariosService.findByEmail(correo);

        if (usuarioExistente) {
            throw new BadRequestException('El usuario ya existe');
        }

        if (invitacionToken) {
            return this.registerConInvitacion(nombre, correo, contrasena, ciudad, fechaNacimiento, invitacionToken);
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        const usuarioCreado = await this.usuariosService.createUsuario({
            nombre,
            correo,
            contrasena: contrasenaHash,
            ciudad,
            fechaNacimiento,
        });

        let advertencia: string | undefined;
        const correoEnviado = await this.enviarConLimite(
            () => this.sendEmailConfirmation(usuarioCreado as Usuario),
            8000,
            `correo de confirmación a ${correo}`,
        );
        if (!correoEnviado) {
            advertencia = 'Cuenta creada. Si no recibís el correo de confirmación en unos minutos, usá "Reenviar confirmación".';
        }

        await this.perfilesService.findOrCreate(usuarioCreado.id);

        return {
            usuario: usuarioCreado,
            ...(advertencia ? { advertencia } : {}),
        };
    }

    private async registerConInvitacion(
        nombre: string,
        correo: string,
        contrasena: string,
        ciudad: string | undefined,
        fechaNacimiento: Date | undefined,
        invitacionToken: string,
    ): Promise<{ usuario: any; token: string; refreshToken: string }> {
        const tokenHash = crypto.createHash('sha256').update(invitacionToken).digest('hex');
        const invitacion = await this.invitacionRepository.findOne({ where: { tokenHash } });
        if (!invitacion) throw new BadRequestException('Invitación inválida');
        if (invitacion.usadoEn) throw new BadRequestException('Invitación ya utilizada');
        if (invitacion.expiraEn.getTime() < Date.now()) throw new BadRequestException('Invitación expirada');
        if (invitacion.email.toLowerCase() !== correo.toLowerCase()) {
            throw new BadRequestException('El correo no coincide con el de la invitación');
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 10);
        const usuarioCreado = await this.usuariosService.createUsuario({
            nombre,
            correo,
            contrasena: contrasenaHash,
            ciudad,
            fechaNacimiento,
        });

        await this.usuariosService.marcarInvitadoVerificado(usuarioCreado.id);
        await this.perfilesService.findOrCreate(usuarioCreado.id);

        const existente = await this.miembroRepository.findOne({
            where: { proyectoId: invitacion.proyectoId, usuarioId: usuarioCreado.id },
        });
        if (!existente) {
            await this.miembroRepository.save(
                this.miembroRepository.create({ proyectoId: invitacion.proyectoId, usuarioId: usuarioCreado.id, rol: invitacion.rol }),
            );
        }
        invitacion.usadoEn = new Date();
        await this.invitacionRepository.save(invitacion);

        const usuario = await this.usuariosService.findById(usuarioCreado.id);
        const { contrasena: _, ...usuarioSinContrasena } = usuario as Usuario & { contrasena?: string };
        this.logger.log(`Registro por invitación: usuarioId=${usuarioCreado.id} proyectoId=${invitacion.proyectoId}`);
        return {
            usuario: usuarioSinContrasena,
            token: this.generateToken(usuarioCreado.id, correo),
            refreshToken: await this.emitirRefreshToken(usuarioCreado.id),
        };
    }

    /** Un invitado completa su registro y pasa a rol normal con acceso total. */
    async completarRegistro(usuarioId: number): Promise<{ usuario: any }> {
        const usuario = await this.usuariosService.findById(usuarioId);
        if (!usuario) throw new BadRequestException('Usuario no encontrado');
        if (usuario.rol !== 'invitado') {
            return { usuario };
        }
        const actualizado = await this.usuariosService.cambiarRol(usuarioId, 'normal');
        this.logger.log(`Cuenta convertida a normal: usuarioId=${usuarioId}`);
        return { usuario: actualizado };
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

        this.logger.log(`Cuenta confirmada para usuarioId=${authToken.usuarioId}`);

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

        const enviado = await this.enviarConLimite(() => this.sendEmailConfirmation(usuario as Usuario), 8000, `correo de confirmación a ${usuario.correo}`);

        if (!enviado) {
            return {
                mensaje: 'Si la cuenta existe, recibirás el correo de confirmación en unos minutos.',
            };
        }

        return {
            mensaje: 'Correo de confirmación reenviado correctamente',
        };
    }

    async solicitarRecuperacion(correo: string): Promise<{ mensaje: string; enlace?: string }> {
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

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const enlaceRecuperacion = `${frontendUrl}/restablecer-contrasena?token=${token}`;

        await this.enviarConLimite(() => this.sendTransactionalEmail(
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
                'recuperacion_solicitada',
                usuario.id,
            ), 8000, `correo de recuperación a ${usuario.correo}`);

        this.logger.log(`Recuperación solicitada para usuarioId=${usuario.id}`);

        return { mensaje };
    }

    async restablecerContrasena(
        token: string,
        nuevaContrasena: string,
    ): Promise<{ mensaje: string }> {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const authToken = await this.authTokenRepository.findOne({
            where: {
                tokenHash,
                tipo: 'recuperacion_password',
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

        const contrasenaHash = await bcrypt.hash(nuevaContrasena, 10);
        await this.usuariosService.cambiarContrasena(authToken.usuarioId, contrasenaHash);

        authToken.usadoEn = new Date();
        await this.authTokenRepository.save(authToken);

        this.logger.log(`Contraseña restablecida para usuarioId=${authToken.usuarioId}`);

        return {
            mensaje: 'Contraseña restablecida correctamente',
        };
    }

    /**
     * Ejecuta un envío con límite de tiempo: si tarda más de `ms`,
     * la request sigue su curso y el envío continúa en segundo plano.
     * Nunca rechaza: los errores quedan registrados en el log.
     */
    private async enviarConLimite(enviar: () => Promise<void>, ms: number, etiqueta: string): Promise<boolean> {
        const tarea = enviar().then(
            () => true,
            (error) => {
                const mensaje = error instanceof Error ? error.message : String(error);
                this.logger.error(`No se pudo enviar ${etiqueta}: ${mensaje}`);
                return false;
            },
        );
        let temporizador: ReturnType<typeof setTimeout>;
        const espera = new Promise<boolean>((resolve) => {
            temporizador = setTimeout(() => resolve(false), ms);
        });
        const resultado = await Promise.race([tarea, espera]);
        clearTimeout(temporizador!);
        return resultado;
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

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const enlaceConfirmacion = `${frontendUrl}/confirmar-cuenta?token=${token}`;

        await this.sendTransactionalEmail(
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
            'confirmacion_enviada',
            usuario.id,
        );
    }

    private async sendTransactionalEmail(
        to: string,
        subject: string,
        template: string,
        context: Record<string, any>,
        evento: 'confirmacion_enviada' | 'recuperacion_solicitada',
        usuarioId?: number,
    ): Promise<void> {
        try {
            const enviado = await this.mailService.sendMail(to, subject, template, context);
            if (!enviado) {
                this.mailMetrics.omitidos += 1;
                this.logger.warn(
                    `Correo omitido (sin proveedor). Evento=${evento} usuarioId=${usuarioId ?? 'desconocido'}. Configura BREVO_API_KEY o SMTP_HOST`,
                );
                return;
            }
            this.mailMetrics.enviados += 1;
            this.logger.log(`Evento=${evento} usuarioId=${usuarioId ?? 'desconocido'} correosEnviados=${this.mailMetrics.enviados}`);
        } catch (error) {
            this.mailMetrics.fallidos += 1;
            this.logger.error(
                `Fallo envío de correo. Evento=${evento} usuarioId=${usuarioId ?? 'desconocido'} correosFallidos=${this.mailMetrics.fallidos}: ${error instanceof Error ? error.message : error}`,
            );
            throw error;
        }
    }
 
}
