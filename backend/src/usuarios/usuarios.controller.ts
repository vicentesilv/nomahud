import { Controller, Delete, Get, Patch } from '@nestjs/common';

@Controller('usuarios')
export class UsuariosController {
    /*funcionalidades relacionadas con el modulo de usuarios
        * creacion de un usuarios
        * chequeo si un usuario existe
        * eliminar la cuenta de un usuario
        * actualizar la informacion de un usuario menos fecha de nacimiento y correo
        * 
    */

    @Patch(':id')
    async updateUser() {}

    @Delete(':id')
    async deleteUser() {}

    

     
}
