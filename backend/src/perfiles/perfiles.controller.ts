import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { PerfilesService } from './perfiles.service';
import { ActualizarPerfilDto } from './dtos/actualizar-perfil.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';
import * as path from 'path';
import * as fs from 'fs';

@Controller('perfiles')
export class PerfilesController {
    constructor(private readonly perfilesService: PerfilesService) {}

    @Get('mi-perfil')
    @UseGuards(JwtAuthGuard)
    async getMiPerfil(@User() usuario: Usuario) {
        return this.perfilesService.findOrCreate(usuario.id);
    }

    @Patch('mi-perfil')
    @UseGuards(JwtAuthGuard)
    async updateMiPerfil(@User() usuario: Usuario, @Body() dto: ActualizarPerfilDto) {
        return this.perfilesService.update(usuario.id, dto);
    }

    @Post('mi-perfil/avatar')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('avatar', {
        storage: diskStorage({
            destination: path.join(process.cwd(), 'uploads', 'avatars'),
            filename: (_req, file, cb) => {
                const ext = path.extname(file.originalname) || '.jpg';
                const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
                cb(null, name);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                cb(new Error('Solo se permiten imágenes'), false);
                return;
            }
            cb(null, true);
        },
    }))
    async uploadAvatar(@User() usuario: Usuario, @UploadedFile() file: any) {
        if (!file) {
            throw new Error('Archivo es requerido');
        }
        const avatarUrl = `/api/perfiles/avatar/${file.filename}`;
        return this.perfilesService.updateAvatar(usuario.id, avatarUrl);
    }

    @Get('avatar/:filename')
    async getAvatar(@Param('filename') filename: string, @Res() res: Response) {
        const ruta = path.join(process.cwd(), 'uploads', 'avatars', filename);
        if (!fs.existsSync(ruta)) {
            res.status(404).json({ mensaje: 'Avatar no encontrado' });
            return;
        }
        res.sendFile(path.resolve(ruta));
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getPerfilPublico(@Param('id', ParseIntPipe) id: number) {
        return this.perfilesService.findByUsuarioId(id);
    }
}
