import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { FinanzasService } from './finanzas.service';
import { CrearTransaccionDto } from './dtos/crear-transaccion.dto';
import { ActualizarTransaccionDto } from './dtos/actualizar-transaccion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('finanzas')
@UseGuards(JwtAuthGuard)
export class FinanzasController {
    constructor(private readonly finanzasService: FinanzasService) {}

    @Post()
    async create(@User() usuario: Usuario, @Body() dto: CrearTransaccionDto) {
        return this.finanzasService.create(usuario.id, dto);
    }

    @Get()
    async findAll(@User() usuario: Usuario) {
        return this.finanzasService.findAll(usuario.id);
    }

    @Get('resumen')
    async getResumen(@User() usuario: Usuario) {
        return this.finanzasService.getResumen(usuario.id);
    }

    @Get(':id')
    async findOne(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        return this.finanzasService.findOne(id, usuario.id);
    }

    @Patch(':id')
    async update(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarTransaccionDto) {
        return this.finanzasService.update(id, usuario.id, dto);
    }

    @Delete(':id')
    async remove(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        await this.finanzasService.remove(id, usuario.id);
        return { mensaje: 'Transacción eliminada correctamente' };
    }
}
