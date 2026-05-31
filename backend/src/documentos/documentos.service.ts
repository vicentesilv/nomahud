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

    async create(creadorId: number, file: Express.Multer.File, dto: CrearDocumentoDto): Promise<Documento> {
        const ext = path.extname(file.originalname);
        const nombre = dto.nombre || file.originalname;
        const archivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

        await fs.writeFile(path.join(this.uploadDir, archivo), file.buffer);

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
        const rutaVieja = path.join(this.uploadDir, doc.archivo);
        await fs.unlink(rutaVieja).catch(() => {});
        const ext = path.extname(file.originalname);
        const archivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        await fs.writeFile(path.join(this.uploadDir, archivo), file.buffer);
        doc.archivo = archivo;
        doc.mimeType = file.mimetype;
        doc.size = file.size;
        return this.documentoRepository.save(doc);
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const doc = await this.findOne(id, creadorId);
        const ruta = path.join(this.uploadDir, doc.archivo);
        await fs.unlink(ruta).catch(() => {});
        await this.documentoRepository.remove(doc);
    }

    getRutaArchivo(archivo: string): string {
        return path.join(this.uploadDir, archivo);
    }
}
