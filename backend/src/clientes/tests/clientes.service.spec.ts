import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientesService } from '../clientes.service';
import { Cliente } from '../entities/cliente.entity';
import { CrearClienteDto } from '../dtos/crear-cliente.dto';
import { ActualizarClienteDto } from '../dtos/actualizar-cliente.dto';

describe('ClientesService', () => {
  let service: ClientesService;
  let repo: jest.Mocked<Repository<Cliente>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: getRepositoryToken(Cliente),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    repo = module.get(getRepositoryToken(Cliente));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create: crea y guarda cliente con creadorId', async () => {
    const dto: CrearClienteDto = { nombre: 'Juan Perez', empresa: 'Acme' };
    const clienteCreado = { id: 1, ...dto, creadorId: 1 } as Cliente;
    repo.create.mockReturnValue(clienteCreado);
    repo.save.mockResolvedValue(clienteCreado);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(repo.save).toHaveBeenCalledWith(clienteCreado);
    expect(result).toBe(clienteCreado);
  });

  it('findAll: retorna clientes del creador ordenados por updatedAt DESC', async () => {
    const clientes = [{ id: 1 }, { id: 2 }] as Cliente[];
    repo.find.mockResolvedValue(clientes);

    const result = await service.findAll(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { creadorId: 1 },
      order: { updatedAt: 'DESC' },
    });
    expect(result).toBe(clientes);
  });

  it('findOne: retorna cliente si existe', async () => {
    const cliente = { id: 1, creadorId: 1 } as Cliente;
    repo.findOne.mockResolvedValue(cliente);

    const result = await service.findOne(1, 1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1, creadorId: 1 } });
    expect(result).toBe(cliente);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza cliente existente', async () => {
    const clienteExistente = { id: 1, creadorId: 1, nombre: 'Viejo' } as Cliente;
    const dto: ActualizarClienteDto = { nombre: 'Nuevo' };
    const clienteGuardado = { ...clienteExistente, nombre: 'Nuevo' } as Cliente;

    repo.findOne.mockResolvedValue(clienteExistente);
    repo.save.mockResolvedValue(clienteGuardado);

    const result = await service.update(1, 1, dto);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1, creadorId: 1 } });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Nuevo' }));
    expect(result).toBe(clienteGuardado);
  });

  it('update: lanza NotFoundException si cliente no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.update(999, 1, { nombre: 'Nuevo' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove: elimina cliente si existe', async () => {
    const cliente = { id: 1, creadorId: 1 } as Cliente;
    repo.findOne.mockResolvedValue(cliente);
    repo.remove.mockResolvedValue(cliente);

    await service.remove(1, 1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1, creadorId: 1 } });
    expect(repo.remove).toHaveBeenCalledWith(cliente);
  });

  it('remove: lanza NotFoundException si cliente no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.remove(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
