import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ViajesService } from '../viajes.service';
import { Viaje } from '../entities/viaje.entity';
import { ItinerarioItem } from '../entities/itinerario-item.entity';
import { FinanzasService } from '../../finanzas/finanzas.service';

describe('ViajesService', () => {
  let service: ViajesService;
  let viajeRepo: jest.Mocked<{
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  }>;
  let itinerarioRepo: jest.Mocked<{
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  }>;
  let finanzasService: jest.Mocked<FinanzasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViajesService,
        {
          provide: getRepositoryToken(Viaje),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ItinerarioItem),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: FinanzasService,
          useValue: {
            create: jest.fn(),
            getResumen: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ViajesService);
    viajeRepo = module.get(getRepositoryToken(Viaje));
    itinerarioRepo = module.get(getRepositoryToken(ItinerarioItem));
    finanzasService = module.get(FinanzasService);
  });

  const makeViaje = (overrides: Partial<Viaje> = {}): Viaje =>
    ({ id: 1, creadorId: 1, destino: 'Paris', fechaInicio: '2026-07-01', fechaFin: '2026-07-10', estado: 'planificado', presupuesto: null, moneda: 'MXN', autoGastoRegistrado: false, ...overrides }) as Viaje;

  it('create: crea viaje con creadorId', async () => {
    finanzasService.getResumen.mockResolvedValue({ balance: 5000, totalIngresos: 5000, totalGastos: 0, ingresos: 5000, gastos: 0 });
    const dto = { destino: 'Paris', fechaInicio: '2026-07-01', presupuesto: 1000, moneda: 'MXN' } as any;
    viajeRepo.create.mockReturnValue(dto as Viaje);
    viajeRepo.save.mockResolvedValue({ id: 1, ...dto, creadorId: 1 } as Viaje);

    const result = await service.create(1, dto);

    expect(viajeRepo.save).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });

  it('create: lanza BadRequestException si fechaInicio > fechaFin', async () => {
    const dto = { destino: 'Paris', fechaInicio: '2026-07-10', fechaFin: '2026-07-01' } as any;

    await expect(service.create(1, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create: lanza BadRequestException si presupuesto supera balance', async () => {
    finanzasService.getResumen.mockResolvedValue({ balance: 100, totalIngresos: 100, totalGastos: 0, ingresos: 100, gastos: 0 });
    const dto = { destino: 'Paris', fechaInicio: '2026-07-01', presupuesto: 500, moneda: 'MXN' } as any;
    viajeRepo.create.mockReturnValue(dto as Viaje);

    await expect(service.create(1, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findAll: retorna viajes del usuario', async () => {
    const viajes = [{ id: 1 }] as Viaje[];
    viajeRepo.find.mockResolvedValue(viajes);

    const result = await service.findAll(1);

    expect(viajeRepo.find).toHaveBeenCalledWith({
      where: { creadorId: 1 },
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(viajes);
  });

  it('findOne: retorna viaje con itinerario', async () => {
    const viaje = { id: 1, creadorId: 1, itinerario: [] } as unknown as Viaje;
    viajeRepo.findOne.mockResolvedValue(viaje);

    const result = await service.findOne(1, 1);

    expect(result).toBe(viaje);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    viajeRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: registra gasto si viaje pasa a completado', async () => {
    const viaje = makeViaje({ estado: 'planificado', presupuesto: 1000 });
    viajeRepo.findOne.mockResolvedValue(viaje);
    const updatedViaje = makeViaje({ estado: 'completado', presupuesto: 1000, autoGastoRegistrado: false });
    viajeRepo.save
      .mockResolvedValueOnce(updatedViaje)
      .mockResolvedValueOnce({ ...updatedViaje, autoGastoRegistrado: true });
    finanzasService.getResumen.mockResolvedValue({ balance: 5000, totalIngresos: 5000, totalGastos: 0, ingresos: 5000, gastos: 0 });

    await service.update(1, 1, { estado: 'completado' } as any);

    expect(finanzasService.create).toHaveBeenCalledWith(1, {
      tipo: 'gasto',
      categoria: 'Viaje',
      monto: 1000,
      moneda: 'MXN',
      descripcion: 'Gasto de viaje: Paris',
      fecha: expect.any(String),
    });
  });

  it('update: no registra gasto si estado no cambia a completado', async () => {
    const viaje = makeViaje({ estado: 'planificado' });
    viajeRepo.findOne.mockResolvedValue(viaje);
    viajeRepo.save.mockResolvedValue(makeViaje({ estado: 'en_curso' }));

    await service.update(1, 1, { estado: 'en_curso' } as any);

    expect(finanzasService.create).not.toHaveBeenCalled();
  });

  it('createItinerarioItem: crea item en viaje existente', async () => {
    const viaje = makeViaje({ presupuesto: 5000 });
    viajeRepo.findOne.mockResolvedValue(viaje);
    itinerarioRepo.find.mockResolvedValue([]);
    itinerarioRepo.create.mockReturnValue({ id: 1, viajeId: 1, lugar: 'Torre Eiffel' } as ItinerarioItem);
    itinerarioRepo.save.mockResolvedValue({ id: 1, viajeId: 1, lugar: 'Torre Eiffel' } as ItinerarioItem);

    const result = await service.createItinerarioItem(1, 1, { lugar: 'Torre Eiffel', costo: 50 });

    expect(itinerarioRepo.save).toHaveBeenCalled();
    expect(result.lugar).toBe('Torre Eiffel');
  });

  it('createItinerarioItem: lanza error si costo supera presupuesto', async () => {
    const viaje = makeViaje({ presupuesto: 100 });
    viajeRepo.findOne.mockResolvedValue(viaje);
    itinerarioRepo.find.mockResolvedValue([{ costo: 80 } as ItinerarioItem]);

    await expect(
      service.createItinerarioItem(1, 1, { lugar: 'Hotel', costo: 50 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateItinerarioItem: actualiza item existente', async () => {
    const viaje = makeViaje({ presupuesto: 5000 });
    const item = { id: 1, viajeId: 1, lugar: 'Viejo', costo: 100 } as ItinerarioItem;
    viajeRepo.findOne.mockResolvedValue(viaje);
    itinerarioRepo.findOne.mockResolvedValue(item);
    itinerarioRepo.find.mockResolvedValue([item]);
    itinerarioRepo.save.mockResolvedValue({ ...item, lugar: 'Nuevo' } as ItinerarioItem);

    const result = await service.updateItinerarioItem(1, 1, 1, { lugar: 'Nuevo' });

    expect(result.lugar).toBe('Nuevo');
  });

  it('updateItinerarioItem: lanza NotFoundException si item no existe', async () => {
    const viaje = makeViaje();
    viajeRepo.findOne.mockResolvedValue(viaje);
    itinerarioRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateItinerarioItem(999, 1, 1, { lugar: 'Nuevo' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removeItinerarioItem: elimina item', async () => {
    const viaje = makeViaje();
    const item = { id: 1, viajeId: 1 } as ItinerarioItem;
    viajeRepo.findOne.mockResolvedValue(viaje);
    itinerarioRepo.findOne.mockResolvedValue(item);

    await service.removeItinerarioItem(1, 1, 1);

    expect(itinerarioRepo.remove).toHaveBeenCalledWith(item);
  });

  it('remove: elimina viaje existente', async () => {
    const viaje = makeViaje();
    viajeRepo.findOne.mockResolvedValue(viaje);

    await service.remove(1, 1);

    expect(viajeRepo.remove).toHaveBeenCalledWith(viaje);
  });

  it('remove: lanza NotFoundException si viaje no existe', async () => {
    viajeRepo.findOne.mockResolvedValue(null);

    await expect(service.remove(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
