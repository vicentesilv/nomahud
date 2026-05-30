import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from './entities/perfil.entity';
import { ActualizarPerfilDto } from './dtos/actualizar-perfil.dto';

@Injectable()
export class PerfilesService {
    constructor(
        @InjectRepository(Perfil)
        private readonly perfilRepository: Repository<Perfil>,
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

        Object.assign(perfil, dto);

        return this.perfilRepository.save(perfil);
    }
}
