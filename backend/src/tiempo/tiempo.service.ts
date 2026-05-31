import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroTiempo } from './entities/registro-tiempo.entity';
import { CrearRegistroTiempoDto } from './dtos/crear-registro-tiempo.dto';
import { ActualizarRegistroTiempoDto } from './dtos/actualizar-registro-tiempo.dto';

@Injectable()
export class TiempoService {
    constructor(
        @InjectRepository(RegistroTiempo)
        private readonly registroRepository: Repository<RegistroTiempo>,
    ) {}

    async create(creadorId: number, dto: CrearRegistroTiempoDto): Promise<RegistroTiempo> {
        const registro = this.registroRepository.create({ ...dto, creadorId });
        return this.registroRepository.save(registro);
    }

    async findAll(creadorId: number): Promise<RegistroTiempo[]> {
        return this.registroRepository.find({
            where: { creadorId },
            order: { fecha: 'DESC', createdAt: 'DESC' },
            relations: ['proyecto', 'tarea'],
        });
    }

    async findOne(id: number, creadorId: number): Promise<RegistroTiempo> {
        const registro = await this.registroRepository.findOne({
            where: { id, creadorId },
            relations: ['proyecto', 'tarea'],
        });

        if (!registro) {
            throw new NotFoundException('Registro no encontrado');
        }

        return registro;
    }

    async update(id: number, creadorId: number, dto: ActualizarRegistroTiempoDto): Promise<RegistroTiempo> {
        const registro = await this.findOne(id, creadorId);
        Object.assign(registro, dto);
        return this.registroRepository.save(registro);
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const registro = await this.findOne(id, creadorId);
        await this.registroRepository.remove(registro);
    }

    async getResumen(creadorId: number): Promise<{ totalHoras: number; registrosHoy: number }> {
        const registros = await this.registroRepository.find({ where: { creadorId } });

        const totalHoras = registros.reduce((sum, r) => sum + Number(r.horas), 0);
        const hoy = new Date().toISOString().slice(0, 10);
        const registrosHoy = registros.filter((r) => r.fecha === hoy).length;

        return { totalHoras, registrosHoy };
    }
}
