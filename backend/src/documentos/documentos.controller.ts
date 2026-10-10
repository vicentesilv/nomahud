import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseEnumPipe, ParseIntPipe, Patch, Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { DocumentosService } from './documentos.service';
import { CrearDocumentoDto } from './dtos/crear-documento.dto';
import { ActualizarDocumentoDto } from './dtos/actualizar-documento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';
import { PaginacionDto } from '../common/dtos/paginacion.dto';
import * as path from 'path';

const MAX_DOC_SIZE = 10 * 1024 * 1024;
const EXTENSIONES_PERMITIDAS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.csv', '.docx', '.xlsx', '.pptx']);
const MIMES_PERMITIDOS = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

function filtroArchivoSeguro(_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.has(ext) || !MIMES_PERMITIDOS.has(file.mimetype)) {
        cb(new BadRequestException('Tipo de archivo no permitido'), false);
        return;
    }
    cb(null, true);
}

function sanitizarNombreDescarga(nombre: string): string {
    return nombre.replace(/["\r\n\\]/g, '_').slice(0, 150) || 'documento';
}

@Controller('documentos')
@UseGuards(JwtAuthGuard)
export class DocumentosController {
    constructor(private readonly documentosService: DocumentosService) {}

    @Post()
    @UseInterceptors(FileInterceptor('archivo', { storage: memoryStorage(), limits: { fileSize: MAX_DOC_SIZE }, fileFilter: filtroArchivoSeguro }))
    async upload(
        @User() usuario: Usuario,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CrearDocumentoDto,
    ) {
        if (!file) {
            throw new BadRequestException('Archivo es requerido');
        }
        return this.documentosService.create(usuario.id, file, dto);
    }

    @Get()
    async findAll(
        @User() usuario: Usuario,
        @Query('tipo', new ParseEnumPipe(['proyecto', 'viaje'], { optional: true })) tipo?: 'proyecto' | 'viaje',
        @Query() pag?: PaginacionDto,
    ) {
        return this.documentosService.findAll(usuario.id, tipo, pag);
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
        const { stream, mimeType } = await this.documentosService.leerArchivo(doc).catch(() => {
            throw new NotFoundException('Archivo no encontrado en el servidor');
        });
        res.setHeader('Content-Disposition', `inline; filename="${sanitizarNombreDescarga(doc.nombre)}"`);
        res.setHeader('Content-Type', mimeType || doc.mimeType || 'application/octet-stream');
        stream.pipe(res);
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
    @UseInterceptors(FileInterceptor('archivo', { storage: memoryStorage(), limits: { fileSize: MAX_DOC_SIZE }, fileFilter: filtroArchivoSeguro }))
    async reemplazarArchivo(
        @User() usuario: Usuario,
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('Archivo es requerido');
        return this.documentosService.reemplazarArchivo(id, usuario.id, file);
    }

    @Delete(':id')
    async remove(@User() usuario: Usuario, @Param('id', ParseIntPipe) id: number) {
        await this.documentosService.remove(id, usuario.id);
        return { mensaje: 'Documento eliminado correctamente' };
    }
}
