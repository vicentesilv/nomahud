import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CrearProyectoDto } from './dtos/crear-proyecto.dto';
import { ActualizarProyectoDto } from './dtos/actualizar-proyecto.dto';
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
    async findAll(@User() usuario: Usuario) {
        return this.proyectosService.findAll(usuario.id);
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
}
