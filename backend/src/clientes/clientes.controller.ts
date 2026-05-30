import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CrearClienteDto } from './dtos/crear-cliente.dto';
import { ActualizarClienteDto } from './dtos/actualizar-cliente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) {}

    @Post()
    async create(@User() usuario: Usuario, @Body() dto: CrearClienteDto) {
        return this.clientesService.create(usuario.id, dto);
    }

    @Get()
    async findAll(@User() usuario: Usuario) {
        return this.clientesService.findAll(usuario.id);
    }

    @Get(':id')
    async findOne(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        return this.clientesService.findOne(id, usuario.id);
    }

    @Patch(':id')
    async update(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarClienteDto) {
        return this.clientesService.update(id, usuario.id, dto);
    }

    @Delete(':id')
    async remove(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        await this.clientesService.remove(id, usuario.id);
        return { mensaje: 'Cliente eliminado correctamente' };
    }
}
