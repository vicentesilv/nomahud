import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
    constructor(private readonly authService: AuthService) {}

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
