import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'crypto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RenovarTokenDto } from './dtos/renovar-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ConfirmarCuentaDto } from './dtos/confirmar-cuenta.dto';
import { ReenviarConfirmacionDto } from './dtos/reenviar-confirmacion.dto';
import { SolicitarRecuperacionDto } from './dtos/solicitar-recuperacion.dto';
import { RestablecerContrasenaDto } from './dtos/restablecer-contrasena.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    @Get('google')
    google(@Res() response: Response) {
        const state = randomBytes(32).toString('hex');
        response.cookie('google_oauth_state', state, {
            httpOnly: true,
            sameSite: 'lax',
            secure: this.configService.get<string>('NODE_ENV') === 'production',
            maxAge: 10 * 60 * 1000,
            path: '/auth/google',
        });
        return response.redirect(this.authService.getGoogleAuthorizationUrl(state));
    }

    @Get('google/callback')
    async googleCallback(
        @Req() request: Request,
        @Res() response: Response,
        @Query('code') code?: string,
        @Query('state') state?: string,
        @Query('error') googleError?: string,
    ): Promise<void> {
        const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').replace(/\/$/, '');
        const errorRedirect = (message: string) => {
            response.redirect(`${frontendUrl}/auth/google/callback#error=${encodeURIComponent(message)}`);
        };
        const stateCookie = this.leerCookie(request, 'google_oauth_state');
        response.clearCookie('google_oauth_state', { path: '/auth/google' });

        if (googleError) {
            errorRedirect('Inicio de sesión cancelado');
            return;
        }
        if (!code || !state || !stateCookie || state.length !== stateCookie.length
            || !timingSafeEqual(Buffer.from(state), Buffer.from(stateCookie))) {
            errorRedirect('No se pudo validar la sesión con Google');
            return;
        }

        try {
            const sesion = await this.authService.loginWithGoogle(code);
            const fragment = new URLSearchParams({
                token: sesion.token,
                refreshToken: sesion.refreshToken,
                usuario: JSON.stringify(sesion.usuario),
            });
            response.redirect(`${frontendUrl}/auth/google/callback#${fragment.toString()}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google';
            errorRedirect(message);
        }
    }

    private leerCookie(request: Request, nombre: string): string | undefined {
        const cookies = request.headers.cookie?.split(';') || [];
        const cookie = cookies.map((item) => item.trim()).find((item) => item.startsWith(`${nombre}=`));
        return cookie ? decodeURIComponent(cookie.slice(nombre.length + 1)) : undefined;
    }

    @Throttle({ auth: { ttl: 60_000, limit: 5 } })
    @Post('inicio-sesion')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.correo, loginDto.contrasena);
    }

    @Throttle({ auth: { ttl: 3_600_000, limit: 10 } })
    @Post('registro')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(
            registerDto.nombre,
            registerDto.correo,
            registerDto.contrasena,
            registerDto.ciudad,
            registerDto.fechaNacimiento,
            registerDto.invitacionToken,
        );
    }

    @Post('completar-registro')
    @UseGuards(JwtAuthGuard)
    async completarRegistro(@User() usuario: Usuario) {
        return this.authService.completarRegistro(usuario.id);
    }

    @Post('confirmar-cuenta')
    async confirmarCuenta(@Body() confirmarCuentaDto: ConfirmarCuentaDto) {
        return this.authService.confirmarCuenta(confirmarCuentaDto.token);
    }

    @Throttle({ auth: { ttl: 3_600_000, limit: 5 } })
    @Post('reenviar-confirmacion')
    async reenviarConfirmacion(@Body() reenviarConfirmacionDto: ReenviarConfirmacionDto) {
        return this.authService.reenviarConfirmacion(reenviarConfirmacionDto.correo);
    }

    @Throttle({ auth: { ttl: 3_600_000, limit: 5 } })
    @Post('solicitar-recuperacion')
    async solicitarRecuperacion(@Body() solicitarRecuperacionDto: SolicitarRecuperacionDto) {
        return this.authService.solicitarRecuperacion(solicitarRecuperacionDto.correo);
    }

    @Post('restablecer-contrasena')
    async restablecerContrasena(@Body() restablecerContrasenaDto: RestablecerContrasenaDto) {
        return this.authService.restablecerContrasena(
            restablecerContrasenaDto.token,
            restablecerContrasenaDto.nuevaContrasena,
        );
    }

    @Throttle({ auth: { ttl: 60_000, limit: 20 } })
    @Post('renovar')
    async renovar(@Body() dto: RenovarTokenDto) {
        return this.authService.renovar(dto.refreshToken);
    }

    @Post('cerrar-sesion')
    @UseGuards(JwtAuthGuard)
    async cerrarSesion(@User() usuario: Usuario, @Body() dto: RenovarTokenDto) {
        return this.authService.cerrarSesion(dto.refreshToken, usuario.id);
    }
}
