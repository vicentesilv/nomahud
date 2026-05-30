import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { TareasService } from './tareas.service';
import { CrearTareaDto } from './dtos/crear-tarea.dto';
import { ActualizarTareaDto } from './dtos/actualizar-tarea.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tareas')
@UseGuards(JwtAuthGuard)
export class TareasController {
    constructor(private readonly tareasService: TareasService) {}

    @Post()
    async create(@Body() dto: CrearTareaDto) {
        return this.tareasService.create(dto);
    }

    @Get('proyecto/:proyectoId')
    async findAllByProyecto(@Param('proyectoId', ParseIntPipe) proyectoId: number) {
        return this.tareasService.findAllByProyecto(proyectoId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.tareasService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarTareaDto) {
        return this.tareasService.update(id, dto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.tareasService.remove(id);
        return { mensaje: 'Tarea eliminada correctamente' };
    }
}
