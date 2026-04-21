import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { hash } from 'bcrypt';
import { CreateUsuarioDto } from './dtos/create.usuario.dto';
import { Usuario } from './entitys/usuarios.entity';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Post()
    async createUser(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        const contrasenaHasheada = await hash(createUsuarioDto.contrasena, 10);
        return this.usuariosService.createUsuario({
            ...createUsuarioDto,
            contrasena: contrasenaHasheada,
        });
    }
    @Get(':id')
    // @UseGuards(JwtAuthGuard)
    async getUser(@Param('id') id: number): Promise<Usuario> {
        const usuario = await this.usuariosService.findById(id);
        if (!usuario) {
            throw new NotFoundException('Usuario no existe');
        }
        return usuario;
    }

    @Patch(':id')
    async updateUser(@Param('id') id: number, @Body() updateUsuarioDto: Partial<CreateUsuarioDto>) {
        return this.usuariosService.updateUsuario(id, updateUsuarioDto);
    }

    @Delete(':id')
    async deleteUser() {}

    

     
}
