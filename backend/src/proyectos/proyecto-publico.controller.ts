import { Controller, Get, Param } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';

@Controller('proyectos-publico')
export class ProyectoPublicoController {
    constructor(private readonly proyectosService: ProyectosService) {}

    @Get(':token')
    async obtener(@Param('token') token: string) {
        return this.proyectosService.obtenerPublicoPorToken(token);
    }
}
