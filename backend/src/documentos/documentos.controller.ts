import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { DocumentosService } from './documentos.service';
import { CrearDocumentoDto } from './dtos/crear-documento.dto';
import { ActualizarDocumentoDto } from './dtos/actualizar-documento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';
import * as path from 'path';
import * as fs from 'fs';

@Controller('documentos')
@UseGuards(JwtAuthGuard)
export class DocumentosController {
    constructor(private readonly documentosService: DocumentosService) {}

    @Post()
    @UseInterceptors(FileInterceptor('archivo', { storage: memoryStorage() }))
    async upload(
        @User() usuario: Usuario,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CrearDocumentoDto,
    ) {
        if (!file) {
            throw new Error('Archivo es requerido');
        }
        return this.documentosService.create(usuario.id, file, dto);
    }

    @Get()
    async findAll(
        @User() usuario: Usuario,
        @Query('tipo') tipo?: string,
    ) {
        return this.documentosService.findAll(usuario.id, tipo);
    }

    @Get(':id')
    async findOne(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        return this.documentosService.findOne(id, usuario.id);
    }

    @Get(':id/download')
    async download(
        @User() usuario: Usuario,
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ) {
        const doc = await this.documentosService.findOne(id, usuario.id);
        const ruta = this.documentosService.getRutaArchivo(doc.archivo);
        if (!fs.existsSync(ruta)) {
            throw new Error('Archivo no encontrado en el servidor');
        }
        res.setHeader('Content-Disposition', `inline; filename="${doc.nombre}"`);
        res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
        res.sendFile(path.resolve(ruta));
    }

    @Patch(':id')
    async update(
        @User() usuario: Usuario,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ActualizarDocumentoDto,
    ) {
        return this.documentosService.update(id, usuario.id, dto);
    }

    @Put(':id/archivo')
    @UseInterceptors(FileInterceptor('archivo', { storage: memoryStorage() }))
    async reemplazarArchivo(
        @User() usuario: Usuario,
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new Error('Archivo es requerido');
        return this.documentosService.reemplazarArchivo(id, usuario.id, file);
    }

    @Delete(':id')
    async remove(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        await this.documentosService.remove(id, usuario.id);
        return { mensaje: 'Documento eliminado correctamente' };
    }
}
