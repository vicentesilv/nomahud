import {
    BadRequestException,
    Body,
    Controller,
    Post,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { CreateUsuarioDto } from '../usuarios/dtos/create.usuario.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('inicio-sesion')
    async login(@Body() loginDto: LoginDto): Promise<{ token: string; usuario: any }> {
        try {
            return await this.authService.login(loginDto.correo, loginDto.contrasena);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw error;
        }
    }

    @Post('registro')
    async register(@Body() registerDto: CreateUsuarioDto): Promise<{ usuario: any }> {
        try {
            return await this.authService.register(
                registerDto.nombre,
                registerDto.correo,
                registerDto.contrasena,
                registerDto.ciudad,
                registerDto.fechaNacimiento,
            );
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw error;
        }
    }
}
