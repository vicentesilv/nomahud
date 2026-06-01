import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TiempoService } from '../tiempo.service';
import { RegistroTiempo } from '../entities/registro-tiempo.entity';
import { CrearRegistroTiempoDto } from '../dtos/crear-registro-tiempo.dto';
import { ActualizarRegistroTiempoDto } from '../dtos/actualizar-registro-tiempo.dto';

describe('TiempoService', () => {
  let service: TiempoService;
  let repo: jest.Mocked<Repository<RegistroTiempo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiempoService,
        {
          provide: getRepositoryToken(RegistroTiempo),
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

    service = module.get<TiempoService>(TiempoService);
    repo = module.get(getRepositoryToken(RegistroTiempo));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create: crea y guarda registro con creadorId', async () => {
    const dto: CrearRegistroTiempoDto = {
      proyectoId: 1,
      horas: 5,
      fecha: '2026-05-01',
    };
    const creado = { id: 1, ...dto, creadorId: 1 } as RegistroTiempo;
    repo.create.mockReturnValue(creado);
    repo.save.mockResolvedValue(creado);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(repo.save).toHaveBeenCalledWith(creado);
    expect(result).toBe(creado);
  });

  it('findAll: retorna registros del creador con relaciones', async () => {
    const registros = [{ id: 1 }, { id: 2 }] as RegistroTiempo[];
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

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1, creadorId: 1 },
      relations: ['proyecto', 'tarea'],
    });
    expect(result).toBe(r);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza registro existente', async () => {
    const existente = { id: 1, creadorId: 1, horas: 3 } as RegistroTiempo;
    const dto: ActualizarRegistroTiempoDto = { horas: 8 };
    const guardado = { ...existente, horas: 8 } as RegistroTiempo;

    repo.findOne.mockResolvedValue(existente);
    repo.save.mockResolvedValue(guardado);

    const result = await service.update(1, 1, dto);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1, creadorId: 1 },
      relations: ['proyecto', 'tarea'],
    });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ horas: 8 }));
    expect(result).toBe(guardado);
  });

  it('remove: elimina registro si existe', async () => {
    const r = { id: 1, creadorId: 1 } as RegistroTiempo;
    repo.findOne.mockResolvedValue(r);
    repo.remove.mockResolvedValue(r);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(r);
  });

  it('getResumen: calcula totalHoras y registrosHoy', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const registros = [
      { id: 1, creadorId: 1, horas: 4, fecha: hoy } as RegistroTiempo,
      { id: 2, creadorId: 1, horas: 6, fecha: hoy } as RegistroTiempo,
      { id: 3, creadorId: 1, horas: 2, fecha: '2026-04-30' } as RegistroTiempo,
    ];
    repo.find.mockResolvedValue(registros);

    const result = await service.getResumen(1);

    expect(result.totalHoras).toBe(12);
    expect(result.registrosHoy).toBe(2);
  });
});
