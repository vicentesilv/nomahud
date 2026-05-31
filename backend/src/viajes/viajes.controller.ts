import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ViajesService } from './viajes.service';
import { CrearViajeDto } from './dtos/crear-viaje.dto';
import { ActualizarViajeDto } from './dtos/actualizar-viaje.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('viajes')
@UseGuards(JwtAuthGuard)
export class ViajesController {
    constructor(private readonly viajesService: ViajesService) {}

    @Post()
    async create(@User() usuario: Usuario, @Body() dto: CrearViajeDto) {
        return this.viajesService.create(usuario.id, dto);
    }

    @Get()
    async findAll(@User() usuario: Usuario) {
        return this.viajesService.findAll(usuario.id);
    }

    @Get(':id')
    async findOne(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        return this.viajesService.findOne(id, usuario.id);
    }

    @Patch(':id')
    async update(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarViajeDto) {
        return this.viajesService.update(id, usuario.id, dto);
    }

    @Delete(':id')
    async remove(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        await this.viajesService.remove(id, usuario.id);
        return { mensaje: 'Viaje eliminado correctamente' };
    }

    @Post(':viajeId/itinerario')
    async createItinerarioItem(
        @User() usuario: Usuario,
        @Param('viajeId', ParseIntPipe) viajeId: number,
        @Body() body: { lugar: string; fecha?: string; descripcion?: string; costo?: number; orden?: number },
    ) {
        return this.viajesService.createItinerarioItem(viajeId, usuario.id, body);
    }

    @Patch(':viajeId/itinerario/:itemId')
    async updateItinerarioItem(
        @User() usuario: Usuario,
        @Param('viajeId', ParseIntPipe) viajeId: number,
        @Param('itemId', ParseIntPipe) itemId: number,
        @Body() body: { lugar?: string; fecha?: string; descripcion?: string; costo?: number; orden?: number },
    ) {
        return this.viajesService.updateItinerarioItem(itemId, viajeId, usuario.id, body);
    }

    @Delete(':viajeId/itinerario/:itemId')
    async removeItinerarioItem(
        @User() usuario: Usuario,
        @Param('viajeId', ParseIntPipe) viajeId: number,
        @Param('itemId', ParseIntPipe) itemId: number,
    ) {
        await this.viajesService.removeItinerarioItem(itemId, viajeId, usuario.id);
        return { mensaje: 'Item eliminado correctamente' };
    }
}
