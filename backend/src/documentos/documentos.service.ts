import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from './entities/documento.entity';
import { CrearDocumentoDto } from './dtos/crear-documento.dto';
import { ActualizarDocumentoDto } from './dtos/actualizar-documento.dto';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class DocumentosService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads', 'documentos');

    constructor(
        @InjectRepository(Documento)
        private readonly documentoRepository: Repository<Documento>,
    ) {
        fs.mkdir(this.uploadDir, { recursive: true }).catch(() => {});
    }

    private validarArchivo(file: Express.Multer.File): string {
        const ext = path.extname(file.originalname).toLowerCase();
        const permitidas = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.csv', '.docx', '.xlsx', '.pptx']);
        if (!permitidas.has(ext)) {
            throw new BadRequestException('Tipo de archivo no permitido');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new BadRequestException('Archivo supera los 10MB');
        }
        return ext;
    }

    private rutaSegura(archivo: string): string {
        const base = path.basename(archivo);
        if (!base || base !== archivo || base.includes('..')) {
            throw new BadRequestException('Nombre de archivo inválido');
        }
        return path.join(this.uploadDir, base);
    }

    async create(creadorId: number, file: Express.Multer.File, dto: CrearDocumentoDto): Promise<Documento> {
        const ext = this.validarArchivo(file);
        const nombre = dto.nombre || file.originalname;
        const archivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

        await fs.writeFile(this.rutaSegura(archivo), file.buffer);

        const doc = this.documentoRepository.create({
            nombre,
            archivo,
            tipo: dto.tipo,
            entidadId: dto.entidadId ?? undefined,
            mimeType: file.mimetype,
            size: file.size,
            creadorId,
        } as Documento);
        return this.documentoRepository.save(doc);
    }

    async findAll(creadorId: number, tipo?: string): Promise<Documento[]> {
        const where: any = { creadorId };
        if (tipo) where.tipo = tipo;
        return this.documentoRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number, creadorId: number): Promise<Documento> {
        const doc = await this.documentoRepository.findOne({ where: { id, creadorId } });
        if (!doc) throw new NotFoundException('Documento no encontrado');
        return doc;
    }

    async update(id: number, creadorId: number, dto: ActualizarDocumentoDto): Promise<Documento> {
        const doc = await this.findOne(id, creadorId);
        Object.assign(doc, dto);
        return this.documentoRepository.save(doc);
    }

    async reemplazarArchivo(id: number, creadorId: number, file: Express.Multer.File): Promise<Documento> {
        const doc = await this.findOne(id, creadorId);
        const rutaVieja = this.rutaSegura(doc.archivo);
        await fs.unlink(rutaVieja).catch(() => {});
        const ext = this.validarArchivo(file);
        const archivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        await fs.writeFile(this.rutaSegura(archivo), file.buffer);
        doc.archivo = archivo;
        doc.mimeType = file.mimetype;
        doc.size = file.size;
        return this.documentoRepository.save(doc);
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const doc = await this.findOne(id, creadorId);
        const ruta = this.rutaSegura(doc.archivo);
        await fs.unlink(ruta).catch(() => {});
        await this.documentoRepository.remove(doc);
    }

    getRutaArchivo(archivo: string): string {
        return this.rutaSegura(archivo);
    }
}
