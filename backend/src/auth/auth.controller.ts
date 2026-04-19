import { Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {

    @Post('inicio-sesion')
    async login() {}

    @Post('registro')
    async register() {}
}
