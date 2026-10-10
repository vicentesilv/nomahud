import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { Usuario } from './entitys/usuarios.entity';
import { UsuariosService } from './usuarios.service';
import { UpdateUsuarioDto } from './dtos/update.usuario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    private verificarPropietario(solicitanteId: number, recursoId: number): void {
        if (solicitanteId !== recursoId) {
            throw new ForbiddenException('No tienes permiso para acceder a este usuario');
        }
    }

    @Get(':id')
    async getUser(@User('id') solicitanteId: number, @Param('id', ParseIntPipe) id: number): Promise<Usuario> {
        this.verificarPropietario(solicitanteId, id);
        const usuario = await this.usuariosService.findById(id);
        if (!usuario) {
            throw new NotFoundException('Usuario no existe');
        }
        return usuario;
    }

    @Patch(':id')
    async updateUser(
        @User('id') solicitanteId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUsuarioDto: UpdateUsuarioDto,
    ) {
        this.verificarPropietario(solicitanteId, id);
        return this.usuariosService.updateUsuario(id, updateUsuarioDto);
    }

    @Delete(':id')
    async deleteUser(@User('id') solicitanteId: number, @Param('id', ParseIntPipe) id: number) {
        this.verificarPropietario(solicitanteId, id);
        return this.usuariosService.deleteUsuario(id);
    }

    

     
}
