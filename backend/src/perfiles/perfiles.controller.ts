import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { PerfilesService } from './perfiles.service';
import { ActualizarPerfilDto } from './dtos/actualizar-perfil.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('perfiles')
export class PerfilesController {
    constructor(private readonly perfilesService: PerfilesService) {}

    @Get('mi-perfil')
    @UseGuards(JwtAuthGuard)
    async getMiPerfil(@User() usuario: Usuario) {
        return this.perfilesService.findOrCreate(usuario.id);
    }

    @Patch('mi-perfil')
    @UseGuards(JwtAuthGuard)
    async updateMiPerfil(@User() usuario: Usuario, @Body() dto: ActualizarPerfilDto) {
        return this.perfilesService.update(usuario.id, dto);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getPerfilPublico(@Param('id', ParseIntPipe) id: number) {
        return this.perfilesService.findByUsuarioId(id);
    }
}
