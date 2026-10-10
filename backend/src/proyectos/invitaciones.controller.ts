import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ProyectosService } from './proyectos.service';
import { AceptarInvitacionDto } from './dtos/aceptar-invitacion.dto';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('proyectos/invitaciones')
@UseGuards(ThrottlerGuard)
export class InvitacionesController {
    constructor(private readonly proyectosService: ProyectosService) {}

    @Throttle({ auth: { ttl: 60_000, limit: 20 } })
    @Get(':token')
    async vistaPrevia(@Param('token') token: string) {
        return this.proyectosService.vistaPreviaInvitacion(token);
    }

    @Throttle({ auth: { ttl: 60_000, limit: 20 } })
    @Post('aceptar')
    async aceptar(@User() usuario: Usuario | undefined, @Body() dto: AceptarInvitacionDto) {
        return this.proyectosService.aceptarInvitacion(dto.token, usuario?.id);
    }
}
