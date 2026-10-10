import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaginacionDto } from '../common/dtos/paginacion.dto';
import { ProyectosService } from './proyectos.service';
import { CrearProyectoDto } from './dtos/crear-proyecto.dto';
import { ActualizarProyectoDto } from './dtos/actualizar-proyecto.dto';
import { InvitarMiembroDto } from './dtos/invitar-miembro.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('proyectos')
@UseGuards(JwtAuthGuard)
export class ProyectosController {
    constructor(private readonly proyectosService: ProyectosService) {}

    @Post()
    async create(@User() usuario: Usuario, @Body() dto: CrearProyectoDto) {
        return this.proyectosService.create(usuario.id, dto);
    }

    @Get()
    async findAll(@User() usuario: Usuario, @Query() pag: PaginacionDto) {
        return this.proyectosService.findAll(usuario.id, pag);
    }

    @Get(':id')
    async findOne(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        return this.proyectosService.findOne(id, usuario.id);
    }

    @Patch(':id')
    async update(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarProyectoDto) {
        return this.proyectosService.update(id, usuario.id, dto);
    }

    @Delete(':id')
    async remove(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        await this.proyectosService.remove(id, usuario.id);
        return { mensaje: 'Proyecto eliminado correctamente' };
    }

    @Post(':id/invitar')
    async invitar(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number, @Body() dto: InvitarMiembroDto) {
        return this.proyectosService.invitarMiembro(id, usuario.id, dto);
    }

    @Get(':id/miembros')
    async miembros(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        return this.proyectosService.listarMiembros(id, usuario.id);
    }

    @Delete(':id/miembros/:usuarioId')
    async expulsar(
        @User() usuario: Usuario,
        @Param('id', ParseIntPipe) id: number,
        @Param('usuarioId', ParseIntPipe) usuarioId: number,
    ) {
        await this.proyectosService.expulsarMiembro(id, usuario.id, usuarioId);
        return { mensaje: 'Miembro eliminado correctamente' };
    }

}
