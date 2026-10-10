import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from './entities/perfil.entity';
import { ActualizarPerfilDto } from './dtos/actualizar-perfil.dto';
import { StorageService } from '../storage/storage.service';
import * as path from 'path';

@Injectable()
export class PerfilesService {
    constructor(
        @InjectRepository(Perfil) private readonly perfilRepository: Repository<Perfil>,
        private readonly storageService: StorageService,
    ) {}

    async findOrCreate(usuarioId: number): Promise<Perfil> {
        let perfil = await this.perfilRepository.findOne({ where: { usuarioId } });

        if (!perfil) {
            perfil = this.perfilRepository.create({ usuarioId });
            perfil = await this.perfilRepository.save(perfil);
        }

        return perfil;
    }

    async findByUsuarioId(usuarioId: number): Promise<Perfil> {
        const perfil = await this.perfilRepository.findOne({ where: { usuarioId } });

        if (!perfil) {
            throw new NotFoundException('Perfil no encontrado');
        }

        return perfil;
    }

    async update(usuarioId: number, dto: ActualizarPerfilDto): Promise<Perfil> {
        const perfil = await this.findOrCreate(usuarioId);

        if (dto.avatarUrl !== undefined && !dto.avatarUrl.startsWith('/api/perfiles/avatar/')) {
            throw new BadRequestException('avatarUrl debe provenir de la subida de avatar');
        }
        Object.assign(perfil, dto);

        return this.perfilRepository.save(perfil);
    }

    async updateAvatar(usuarioId: number, buffer: Buffer, extension: string, mimeType: string): Promise<Perfil> {
        const perfil = await this.findOrCreate(usuarioId);
        const ext = (extension || '.jpg').toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
            throw new BadRequestException('Tipo de imagen no permitido');
        }

        const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        await this.storageService.guardar('avatars', nombre, buffer, mimeType);

        const oldAvatar = perfil.avatarUrl;
        perfil.avatarUrl = `/api/perfiles/avatar/${nombre}`;
        const updated = await this.perfilRepository.save(perfil);

        if (oldAvatar && oldAvatar.startsWith('/api/perfiles/avatar/')) {
            const viejo = oldAvatar.replace('/api/perfiles/avatar/', '');
            if (viejo !== nombre) {
                await this.storageService.borrar(`avatars/${viejo}`).catch(() => {});
            }
        }

        return updated;
    }

    async leerAvatar(filename: string): Promise<{ stream: NodeJS.ReadableStream; mimeType?: string }> {
        const base = path.basename(filename);
        if (!base || base !== filename) {
            throw new BadRequestException('Nombre de archivo inválido');
        }
        return this.storageService.leer(`avatars/${base}`);
    }
}
