import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TiempoService } from '../tiempo.service';
import { RegistroTiempo } from '../entities/registro-tiempo.entity';

describe('TiempoService', () => {
  let service: TiempoService;
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
        TiempoService,
        {
          provide: getRepositoryToken(RegistroTiempo),
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

    service = module.get(TiempoService);
    repo = module.get(getRepositoryToken(RegistroTiempo));
  });

  it('create: crea registro con creadorId', async () => {
    const dto = { proyectoId: 1, horas: 5, fecha: '2026-06-01' } as any;
    repo.create.mockReturnValue({ ...dto, creadorId: 1 } as RegistroTiempo);
    repo.save.mockResolvedValue({ id: 1, ...dto, creadorId: 1 } as RegistroTiempo);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(result.id).toBe(1);
  });

  it('findAll: retorna registros del usuario', async () => {
    const registros = [{ id: 1 }] as RegistroTiempo[];
    repo.find.mockResolvedValue(registros);

    const result = await service.findAll(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { creadorId: 1 },
      order: { fecha: 'DESC', createdAt: 'DESC' },
      relations: ['proyecto', 'tarea'],
    });
    expect(result).toBe(registros);
  });

  it('findOne: retorna registro si existe', async () => {
    const r = { id: 1, creadorId: 1 } as RegistroTiempo;
    repo.findOne.mockResolvedValue(r);

    const result = await service.findOne(1, 1);

    expect(result).toBe(r);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza y guarda', async () => {
    const r = { id: 1, creadorId: 1, horas: 5 } as RegistroTiempo;
    repo.findOne.mockResolvedValue(r);
    repo.save.mockResolvedValue({ ...r, horas: 8 } as RegistroTiempo);

    const result = await service.update(1, 1, { horas: 8 } as any);

    expect(result.horas).toBe(8);
  });

  it('remove: elimina registro existente', async () => {
    const r = { id: 1, creadorId: 1 } as RegistroTiempo;
    repo.findOne.mockResolvedValue(r);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(r);
  });

  it('getResumen: calcula totalHoras y registrosHoy', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const registros = [
      { horas: 5, fecha: hoy } as RegistroTiempo,
      { horas: 3, fecha: hoy } as RegistroTiempo,
      { horas: 2, fecha: '2026-05-01' } as RegistroTiempo,
    ];
    repo.find.mockResolvedValue(registros);

    const result = await service.getResumen(1);

    expect(result.totalHoras).toBe(10);
    expect(result.registrosHoy).toBe(2);
  });
});
