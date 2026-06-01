import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FinanzasService } from '../finanzas.service';
import { Transaccion } from '../entities/transaccion.entity';

describe('FinanzasService', () => {
  let service: FinanzasService;
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
        FinanzasService,
        {
          provide: getRepositoryToken(Transaccion),
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

    service = module.get(FinanzasService);
    repo = module.get(getRepositoryToken(Transaccion));
  });

  it('create: crea transaccion con creadorId', async () => {
    const dto = {
      tipo: 'ingreso' as const,
      categoria: 'Ventas',
      monto: 1000,
      fecha: '2026-06-01',
    } as any;
    repo.create.mockReturnValue({ ...dto, creadorId: 1 } as Transaccion);
    repo.save.mockResolvedValue({ id: 1, ...dto, creadorId: 1 } as Transaccion);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(result.id).toBe(1);
  });

  it('findAll: retorna transacciones del usuario', async () => {
    const transacciones = [{ id: 1 }] as Transaccion[];
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

    expect(result).toBe(t);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza y guarda', async () => {
    const t = { id: 1, creadorId: 1, monto: 100 } as Transaccion;
    repo.findOne.mockResolvedValue(t);
    repo.save.mockResolvedValue({ ...t, monto: 200 } as Transaccion);

    const result = await service.update(1, 1, { monto: 200 } as any);

    expect(result.monto).toBe(200);
  });

  it('remove: elimina transaccion existente', async () => {
    const t = { id: 1, creadorId: 1 } as Transaccion;
    repo.findOne.mockResolvedValue(t);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(t);
  });

  it('getResumen: calcula ingresos, gastos y balance', async () => {
    const transacciones = [
      { tipo: 'ingreso', monto: 1000 } as Transaccion,
      { tipo: 'ingreso', monto: 500 } as Transaccion,
      { tipo: 'gasto', monto: 300 } as Transaccion,
    ];
    repo.find.mockResolvedValue(transacciones);

    const result = await service.getResumen(1);

    expect(result.totalIngresos).toBe(1500);
    expect(result.totalGastos).toBe(300);
    expect(result.balance).toBe(1200);
  });

  it('getResumen: retorna ceros si no hay transacciones', async () => {
    repo.find.mockResolvedValue([]);

    const result = await service.getResumen(1);

    expect(result).toEqual({
      totalIngresos: 0,
      totalGastos: 0,
      balance: 0,
      ingresos: 0,
      gastos: 0,
    });
  });
});
