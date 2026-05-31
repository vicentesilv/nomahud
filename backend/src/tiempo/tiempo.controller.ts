import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { TiempoService } from './tiempo.service';
import { CrearRegistroTiempoDto } from './dtos/crear-registro-tiempo.dto';
import { ActualizarRegistroTiempoDto } from './dtos/actualizar-registro-tiempo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('tiempo')
@UseGuards(JwtAuthGuard)
export class TiempoController {
    constructor(private readonly tiempoService: TiempoService) {}

    @Post()
    async create(@User() usuario: Usuario, @Body() dto: CrearRegistroTiempoDto) {
        return this.tiempoService.create(usuario.id, dto);
    }

    @Get()
    async findAll(@User() usuario: Usuario) {
        return this.tiempoService.findAll(usuario.id);
    }

    @Get('resumen')
    async getResumen(@User() usuario: Usuario) {
        return this.tiempoService.getResumen(usuario.id);
    }

    @Get(':id')
    async findOne(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        return this.tiempoService.findOne(id, usuario.id);
    }

    @Patch(':id')
    async update(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarRegistroTiempoDto) {
        return this.tiempoService.update(id, usuario.id, dto);
    }

    @Delete(':id')
    async remove(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        await this.tiempoService.remove(id, usuario.id);
        return { mensaje: 'Registro eliminado correctamente' };
    }
}
