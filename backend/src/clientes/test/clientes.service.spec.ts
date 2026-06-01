import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClientesService } from '../clientes.service';
import { Cliente } from '../entities/cliente.entity';

describe('ClientesService', () => {
  let service: ClientesService;
  let repo: jest.Mocked<{
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: getRepositoryToken(Cliente),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ClientesService);
    repo = module.get(getRepositoryToken(Cliente));
  });

  it('create: crea cliente con creadorId', async () => {
    const dto = { nombre: 'Cliente Test' } as any;
    repo.create.mockReturnValue({ ...dto, creadorId: 1 } as Cliente);
    repo.save.mockResolvedValue({ id: 1, ...dto, creadorId: 1 } as Cliente);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(result.id).toBe(1);
  });

  it('findAll: retorna clientes del usuario', async () => {
    const clientes = [{ id: 1 }] as Cliente[];
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

    expect(result).toBe(cliente);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza y guarda cliente', async () => {
    const cliente = { id: 1, creadorId: 1, nombre: 'Viejo' } as Cliente;
    repo.findOne.mockResolvedValue(cliente);
    repo.save.mockResolvedValue({ ...cliente, nombre: 'Nuevo' } as Cliente);

    const result = await service.update(1, 1, { nombre: 'Nuevo' } as any);

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Nuevo' }));
    expect(result.nombre).toBe('Nuevo');
  });

  it('remove: elimina cliente existente', async () => {
    const cliente = { id: 1, creadorId: 1 } as Cliente;
    repo.findOne.mockResolvedValue(cliente);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(cliente);
  });
});
