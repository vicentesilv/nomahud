import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from './entities/perfil.entity';
import { ActualizarPerfilDto } from './dtos/actualizar-perfil.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PerfilesService {
    private readonly avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');

    constructor(
        @InjectRepository(Perfil)
        private readonly perfilRepository: Repository<Perfil>,
    ) {
        fs.mkdirSync(this.avatarsDir, { recursive: true });
    }

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

        Object.assign(perfil, dto);

        return this.perfilRepository.save(perfil);
    }

    async updateAvatar(usuarioId: number, avatarUrl: string): Promise<Perfil> {
        const perfil = await this.findOrCreate(usuarioId);

        const oldAvatar = perfil.avatarUrl;
        perfil.avatarUrl = avatarUrl;
        const updated = await this.perfilRepository.save(perfil);

        if (oldAvatar && oldAvatar.startsWith('/api/perfiles/avatar/')) {
            const oldFilename = oldAvatar.replace('/api/perfiles/avatar/', '');
            const oldPath = path.join(this.avatarsDir, oldFilename);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        return updated;
    }
}
