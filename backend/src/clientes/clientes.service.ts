import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CrearClienteDto } from './dtos/crear-cliente.dto';
import { ActualizarClienteDto } from './dtos/actualizar-cliente.dto';
import { PaginacionDto, Pagina, paginar, skipTake } from '../common/dtos/paginacion.dto';

@Injectable()
export class ClientesService {
    constructor(
        @InjectRepository(Cliente)
        private readonly clienteRepository: Repository<Cliente>,
    ) {}

    async create(creadorId: number, dto: CrearClienteDto): Promise<Cliente> {
        const cliente = this.clienteRepository.create({ ...dto, creadorId });
        return this.clienteRepository.save(cliente);
    }

    async findAll(creadorId: number, pag?: PaginacionDto): Promise<Pagina<Cliente>> {
        const { skip, take } = skipTake(pag ?? {});
        const [datos, total] = await this.clienteRepository.findAndCount({
            where: { creadorId },
            order: { updatedAt: 'DESC' },
            skip,
            take,
        });
        return paginar(datos, total, pag ?? {});
    }

    async findOne(id: number, creadorId: number): Promise<Cliente> {
        const cliente = await this.clienteRepository.findOne({ where: { id, creadorId } });

        if (!cliente) {
            throw new NotFoundException('Cliente no encontrado');
        }

        return cliente;
    }

    async update(id: number, creadorId: number, dto: ActualizarClienteDto): Promise<Cliente> {
        const cliente = await this.findOne(id, creadorId);
        Object.assign(cliente, dto);
        return this.clienteRepository.save(cliente);
    }

    async remove(id: number, creadorId: number): Promise<void> {
        const cliente = await this.findOne(id, creadorId);
        await this.clienteRepository.remove(cliente);
    }
}
