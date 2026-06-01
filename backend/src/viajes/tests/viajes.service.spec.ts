import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ViajesService } from '../viajes.service';
import { Viaje } from '../entities/viaje.entity';
import { ItinerarioItem } from '../entities/itinerario-item.entity';
import { CrearViajeDto } from '../dtos/crear-viaje.dto';
import { ActualizarViajeDto } from '../dtos/actualizar-viaje.dto';
import { FinanzasService } from '../../finanzas/finanzas.service';

describe('ViajesService', () => {
  let service: ViajesService;
  let viajeRepo: jest.Mocked<Repository<Viaje>>;
  let itinerarioRepo: jest.Mocked<Repository<ItinerarioItem>>;
  let finanzasService: jest.Mocked<FinanzasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViajesService,
        {
          provide: getRepositoryToken(Viaje),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ItinerarioItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
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

    service = module.get<ViajesService>(ViajesService);
    viajeRepo = module.get(getRepositoryToken(Viaje));
    itinerarioRepo = module.get(getRepositoryToken(ItinerarioItem));
    finanzasService = module.get(FinanzasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('crea viaje correctamente', async () => {
      const dto: CrearViajeDto = { destino: 'Paris', fechaInicio: '2026-06-01', fechaFin: '2026-06-10' };
      const creado = { id: 1, ...dto, creadorId: 1 } as Viaje;
      viajeRepo.create.mockReturnValue(creado as any);
      viajeRepo.save.mockResolvedValue(creado);

      const result = await service.create(1, dto);

      expect(viajeRepo.create).toHaveBeenCalledWith(dto as any);
      expect(viajeRepo.save).toHaveBeenCalled();
      expect(result).toBe(creado);
    });

    it('lanza BadRequestException si fechaInicio > fechaFin', async () => {
      const dto: CrearViajeDto = { destino: 'Paris', fechaInicio: '2026-07-01', fechaFin: '2026-06-01' };

      await expect(service.create(1, dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(viajeRepo.save).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si presupuesto supera balance', async () => {
      finanzasService.getResumen.mockResolvedValue({ totalIngresos: 100, totalGastos: 50, balance: 50, ingresos: 100, gastos: 50 });
      const dto: CrearViajeDto = { destino: 'Paris', fechaInicio: '2026-06-01', presupuesto: 100 };

      await expect(service.create(1, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('retorna viajes del creador', async () => {
      const viajes = [{ id: 1 }, { id: 2 }] as Viaje[];
      viajeRepo.find.mockResolvedValue(viajes);

      const result = await service.findAll(1);

      expect(viajeRepo.find).toHaveBeenCalledWith({
        where: { creadorId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toBe(viajes);
    });
  });

  describe('findOne', () => {
    it('retorna viaje con itinerario si existe', async () => {
      const v = { id: 1, creadorId: 1 } as Viaje;
      viajeRepo.findOne.mockResolvedValue(v);

      const result = await service.findOne(1, 1);

      expect(viajeRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, creadorId: 1 },
        relations: ['itinerario'],
        order: { itinerario: { orden: 'ASC' } },
      });
      expect(result).toBe(v);
    });

    it('lanza NotFoundException si no existe', async () => {
      viajeRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza viaje correctamente', async () => {
      const existente = { id: 1, creadorId: 1, destino: 'Paris', estado: 'planificado' as const, fechaInicio: '2026-06-01', moneda: 'MXN' } as Viaje;
      const dto: ActualizarViajeDto = { destino: 'Londres' };
      const guardado = { ...existente, destino: 'Londres' } as Viaje;

      viajeRepo.findOne.mockResolvedValue(existente);
      viajeRepo.save.mockResolvedValue(guardado);

      const result = await service.update(1, 1, dto);

      expect(viajeRepo.findOne).toHaveBeenCalledWith({ where: { id: 1, creadorId: 1 } });
      expect(viajeRepo.save).toHaveBeenCalledWith(expect.objectContaining({ destino: 'Londres' }));
      expect(result).toBe(guardado);
    });

    it('lanza NotFoundException si no existe', async () => {
      viajeRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, 1, { destino: 'Nuevo' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('registra gasto automatico al completar viaje con presupuesto', async () => {
      const existente = {
        id: 1, creadorId: 1, destino: 'Paris', estado: 'planificado' as const,
        presupuesto: 5000, moneda: 'MXN', fechaInicio: '2026-06-01', autoGastoRegistrado: false,
      } as Viaje;
      const dto: ActualizarViajeDto = { estado: 'completado' };
      const guardado = { ...existente, estado: 'completado' as const } as Viaje;

      viajeRepo.findOne.mockResolvedValue(existente);
      viajeRepo.save.mockResolvedValue(guardado);

      await service.update(1, 1, dto);

      expect(finanzasService.create).toHaveBeenCalledWith(1, {
        tipo: 'gasto',
        categoria: 'Viaje',
        monto: 5000,
        moneda: 'MXN',
        descripcion: 'Gasto de viaje: Paris',
        fecha: expect.any(String),
      });
    });
  });

  describe('remove', () => {
    it('elimina viaje si existe', async () => {
      const v = { id: 1, creadorId: 1 } as Viaje;
      viajeRepo.findOne.mockResolvedValue(v);
      viajeRepo.remove.mockResolvedValue(v);

      await service.remove(1, 1);

      expect(viajeRepo.remove).toHaveBeenCalledWith(v);
    });
  });

  describe('itinerario items', () => {
    it('createItinerarioItem: crea item correctamente', async () => {
      const viaje = { id: 1, creadorId: 1, fechaInicio: '2026-06-01', fechaFin: '2026-06-10', presupuesto: null } as Viaje;
      viajeRepo.findOne.mockResolvedValue(viaje);
      const itemCreado = { id: 1, viajeId: 1, lugar: 'Torre Eiffel' } as ItinerarioItem;
      itinerarioRepo.create.mockReturnValue(itemCreado);
      itinerarioRepo.save.mockResolvedValue(itemCreado);

      const result = await service.createItinerarioItem(1, 1, { lugar: 'Torre Eiffel' });

      expect(itinerarioRepo.create).toHaveBeenCalledWith({ lugar: 'Torre Eiffel', viajeId: 1 });
      expect(itinerarioRepo.save).toHaveBeenCalledWith(itemCreado);
      expect(result).toBe(itemCreado);
    });

    it('createItinerarioItem: valida fecha en rango del viaje', async () => {
      const viaje = { id: 1, creadorId: 1, fechaInicio: '2026-06-01', fechaFin: '2026-06-10' } as Viaje;
      viajeRepo.findOne.mockResolvedValue(viaje);

      await expect(
        service.createItinerarioItem(1, 1, { lugar: 'X', fecha: '2026-07-01' })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updateItinerarioItem: actualiza item correctamente', async () => {
      const viaje = { id: 1, creadorId: 1, fechaInicio: '2026-06-01', fechaFin: '2026-06-10', presupuesto: null } as Viaje;
      viajeRepo.findOne.mockResolvedValue(viaje);
      const item = { id: 1, viajeId: 1, lugar: 'Viejo', costo: 0 } as ItinerarioItem;
      itinerarioRepo.findOne.mockResolvedValue(item);
      const itemGuardado = { ...item, lugar: 'Nuevo' } as ItinerarioItem;
      itinerarioRepo.save.mockResolvedValue(itemGuardado);

      const result = await service.updateItinerarioItem(1, 1, 1, { lugar: 'Nuevo' });

      expect(itinerarioRepo.save).toHaveBeenCalledWith(expect.objectContaining({ lugar: 'Nuevo' }));
      expect(result).toBe(itemGuardado);
    });

    it('removeItinerarioItem: elimina item si existe', async () => {
      const viaje = { id: 1, creadorId: 1 } as Viaje;
      viajeRepo.findOne.mockResolvedValue(viaje);
      const item = { id: 1, viajeId: 1 } as ItinerarioItem;
      itinerarioRepo.findOne.mockResolvedValue(item);
      itinerarioRepo.remove.mockResolvedValue(item);

      await service.removeItinerarioItem(1, 1, 1);

      expect(itinerarioRepo.remove).toHaveBeenCalledWith(item);
    });

    it('removeItinerarioItem: lanza NotFoundException si item no existe', async () => {
      const viaje = { id: 1, creadorId: 1 } as Viaje;
      viajeRepo.findOne.mockResolvedValue(viaje);
      itinerarioRepo.findOne.mockResolvedValue(null);

      await expect(service.removeItinerarioItem(999, 1, 1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
