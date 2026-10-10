import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, existsSync } from 'fs';

export interface ArchivoGuardado {
    clave: string;
    url: string;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly bucket = process.env.S3_BUCKET?.trim();
    private readonly region = process.env.S3_REGION?.trim() || 'us-east-1';
    private readonly localDir = path.join(process.cwd(), 'uploads');
    private s3: S3Client | null = null;

    constructor() {
        if (this.bucket) {
            this.s3 = new S3Client({
                region: this.region,
                credentials:
                    process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
                        ? { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY }
                        : undefined,
                endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
                forcePathStyle: process.env.S3_ENDPOINT ? true : undefined,
            });
            this.logger.log(`Storage S3 activado (bucket=${this.bucket})`);
        }
        fs.mkdir(this.localDir, { recursive: true }).catch(() => {});
    }

    get usaS3(): boolean {
        return this.s3 != null;
    }

    async guardar(carpeta: string, nombre: string, buffer: Buffer, mimeType?: string): Promise<ArchivoGuardado> {
        const clave = `${carpeta}/${nombre}`;
        if (this.s3 && this.bucket) {
            await this.s3.send(
                new PutObjectCommand({ Bucket: this.bucket, Key: clave, Body: buffer, ContentType: mimeType }),
            );
            return { clave, url: `s3://${this.bucket}/${clave}` };
        }
        const ruta = path.join(this.localDir, clave);
        await fs.mkdir(path.dirname(ruta), { recursive: true });
        await fs.writeFile(ruta, buffer);
        return { clave, url: `/archivos/${clave}` };
    }

    async leer(clave: string): Promise<{ stream: NodeJS.ReadableStream; mimeType?: string; tamano?: number }> {
        this.validarClave(clave);
        if (this.s3 && this.bucket) {
            const out = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: clave }));
            const stream = out.Body as Readable;
            return { stream, mimeType: out.ContentType, tamano: out.ContentLength };
        }
        const ruta = path.join(this.localDir, clave);
        if (!existsSync(ruta)) {
            throw new BadRequestException('Archivo no encontrado');
        }
        return { stream: createReadStream(ruta) };
    }

    async borrar(clave: string): Promise<void> {
        this.validarClave(clave);
        if (this.s3 && this.bucket) {
            await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: clave })).catch(() => {});
            return;
        }
        await fs.unlink(path.join(this.localDir, clave)).catch(() => {});
    }

    /** Compatibilidad con archivos guardados antes del StorageService (rutas locales). */
    claveDesdeUrl(urlOClave: string): string {
        if (urlOClave.startsWith('s3://')) {
            return urlOClave.replace(/^s3:\/\/[^/]+\//, '');
        }
        const sinPrefijo = urlOClave
            .replace(/^\/api\/perfiles\/avatar\//, 'avatars/')
            .replace(/^\/archivos\//, '');
        if (sinPrefijo.includes('..') || path.isAbsolute(sinPrefijo)) {
            throw new BadRequestException('Referencia de archivo inválida');
        }
        return sinPrefijo;
    }

    private validarClave(clave: string): void {
        if (!clave || clave.includes('..') || path.isAbsolute(clave)) {
            throw new BadRequestException('Referencia de archivo inválida');
        }
    }
}
