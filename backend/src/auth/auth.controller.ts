import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ConfirmarCuentaDto } from './dtos/confirmar-cuenta.dto';
import { ReenviarConfirmacionDto } from './dtos/reenviar-confirmacion.dto';
import { SolicitarRecuperacionDto } from './dtos/solicitar-recuperacion.dto';
import { RestablecerContrasenaDto } from './dtos/restablecer-contrasena.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('inicio-sesion')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.correo, loginDto.contrasena);
    }

    @Post('registro')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(
            registerDto.nombre,
            registerDto.correo,
            registerDto.contrasena,
            registerDto.ciudad,
            registerDto.fechaNacimiento,
        );
    }

    @Post('confirmar-cuenta')
    async confirmarCuenta(@Body() confirmarCuentaDto: ConfirmarCuentaDto) {
        return this.authService.confirmarCuenta(confirmarCuentaDto.token);
    }

    @Post('reenviar-confirmacion')
    async reenviarConfirmacion(@Body() reenviarConfirmacionDto: ReenviarConfirmacionDto) {
        return this.authService.reenviarConfirmacion(reenviarConfirmacionDto.correo);
    }

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
}
