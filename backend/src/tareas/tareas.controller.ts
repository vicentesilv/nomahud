import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaginacionDto } from '../common/dtos/paginacion.dto';
import { TareasService } from './tareas.service';
import { CrearTareaDto } from './dtos/crear-tarea.dto';
import { ActualizarTareaDto } from './dtos/actualizar-tarea.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('tareas')
@UseGuards(JwtAuthGuard)
export class TareasController {
    constructor(private readonly tareasService: TareasService) {}

    @Post()
    async create(@User('id') userId: number, @Body() dto: CrearTareaDto) {
        return this.tareasService.create(userId, dto);
    }

    @Get()
    async findAll(@User('id') userId: number, @Query() pag: PaginacionDto) {
        return this.tareasService.findAll(userId, pag);
    }

    @Get('proyecto/:proyectoId')
    async findAllByProyecto(@User('id') userId: number, @Param('proyectoId', ParseIntPipe) proyectoId: number) {
        return this.tareasService.findAllByProyecto(proyectoId, userId);
    }

    @Get(':id')
    async findOne(@User('id') userId: number, @Param('id', ParseIntPipe) id: number) {
        return this.tareasService.findOne(id, userId);
    }

    @Patch(':id')
    async update(@User('id') userId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarTareaDto) {
        return this.tareasService.update(id, userId, dto);
    }

    @Delete(':id')
    async remove(@User('id') userId: number, @Param('id', ParseIntPipe) id: number) {
        await this.tareasService.remove(id, userId);
        return { mensaje: 'Tarea eliminada correctamente' };
    }
}
