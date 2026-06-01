import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FinanzasService } from '../finanzas.service';
import { Transaccion } from '../entities/transaccion.entity';
import { CrearTransaccionDto } from '../dtos/crear-transaccion.dto';
import { ActualizarTransaccionDto } from '../dtos/actualizar-transaccion.dto';

describe('FinanzasService', () => {
  let service: FinanzasService;
  let repo: jest.Mocked<Repository<Transaccion>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanzasService,
        {
          provide: getRepositoryToken(Transaccion),
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

    service = module.get<FinanzasService>(FinanzasService);
    repo = module.get(getRepositoryToken(Transaccion));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create: crea y guarda transaccion con creadorId', async () => {
    const dto: CrearTransaccionDto = {
      tipo: 'ingreso',
      categoria: 'Desarrollo',
      monto: 1000,
      fecha: '2026-05-01',
    };
    const creada = { id: 1, ...dto, creadorId: 1 } as Transaccion;
    repo.create.mockReturnValue(creada);
    repo.save.mockResolvedValue(creada);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(repo.save).toHaveBeenCalledWith(creada);
    expect(result).toBe(creada);
  });

  it('findAll: retorna transacciones del creador con relaciones', async () => {
    const transacciones = [{ id: 1 }, { id: 2 }] as Transaccion[];
    repo.find.mockResolvedValue(transacciones);

    const result = await service.findAll(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { creadorId: 1 },
      order: { fecha: 'DESC', createdAt: 'DESC' },
      relations: ['proyecto', 'cliente'],
    });
    expect(result).toBe(transacciones);
  });

  it('findOne: retorna transaccion si existe', async () => {
    const t = { id: 1, creadorId: 1 } as Transaccion;
    repo.findOne.mockResolvedValue(t);

    const result = await service.findOne(1, 1);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1, creadorId: 1 },
      relations: ['proyecto', 'cliente'],
    });
    expect(result).toBe(t);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza transaccion existente', async () => {
    const existente = { id: 1, creadorId: 1, monto: 500 } as Transaccion;
    const dto: ActualizarTransaccionDto = { monto: 1000 };
    const guardado = { ...existente, monto: 1000 } as Transaccion;

    repo.findOne.mockResolvedValue(existente);
    repo.save.mockResolvedValue(guardado);

    const result = await service.update(1, 1, dto);

    expect(repo.findById).not.toBeDefined();
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1, creadorId: 1 },
      relations: ['proyecto', 'cliente'],
    });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ monto: 1000 }));
    expect(result).toBe(guardado);
  });

  it('remove: elimina transaccion si existe', async () => {
    const t = { id: 1, creadorId: 1 } as Transaccion;
    repo.findOne.mockResolvedValue(t);
    repo.remove.mockResolvedValue(t);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(t);
  });

  it('getResumen: calcula ingresos, gastos y balance', async () => {
    const transacciones = [
      { id: 1, tipo: 'ingreso', monto: 2000 } as Transaccion,
      { id: 2, tipo: 'ingreso', monto: 500 } as Transaccion,
      { id: 3, tipo: 'gasto', monto: 800 } as Transaccion,
    ];
    repo.find.mockResolvedValue(transacciones);

    const result = await service.getResumen(1);

    expect(result.totalIngresos).toBe(2500);
    expect(result.totalGastos).toBe(800);
    expect(result.balance).toBe(1700);
    expect(result.ingresos).toBe(2500);
    expect(result.gastos).toBe(800);
  });
});
