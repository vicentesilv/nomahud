import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { PerfilesService } from './perfiles.service';
import { ActualizarPerfilDto } from './dtos/actualizar-perfil.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';
import * as path from 'path';

function mimePorExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.gif') return 'image/gif';
    return 'image/jpeg';
}

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
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                cb(new BadRequestException('Solo se permiten imágenes'), false);
                return;
            }
            cb(null, true);
        },
    }))
    async uploadAvatar(@User() usuario: Usuario, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Archivo es requerido');
        }
        return this.perfilesService.updateAvatar(usuario.id, file.buffer, path.extname(file.originalname) || '.jpg', file.mimetype);
    }

    @Get('avatar/:filename')
    async getAvatar(@Param('filename') filename: string, @Res() res: Response) {
        const base = path.basename(filename);
        if (!base || base !== filename || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp|gif)$/i.test(base)) {
            res.status(400).json({ mensaje: 'Nombre de archivo inválido' });
            return;
        }
        try {
            const { stream, mimeType } = await this.perfilesService.leerAvatar(base);
            res.setHeader('Content-Type', mimeType || mimePorExtension(base));
            stream.pipe(res);
        } catch {
            throw new NotFoundException('Avatar no encontrado');
        }
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getPerfilPublico(@Param('id', ParseIntPipe) id: number) {
        return this.perfilesService.findByUsuarioId(id);
    }
}
