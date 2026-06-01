import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ViajesController } from '../viajes.controller';
import { ViajesService } from '../viajes.service';
import { CrearViajeDto } from '../dtos/crear-viaje.dto';
import { ActualizarViajeDto } from '../dtos/actualizar-viaje.dto';
import { CrearItinerarioItemDto } from '../dtos/crear-itinerario-item.dto';
import { ActualizarItinerarioItemDto } from '../dtos/actualizar-itinerario-item.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('ViajesController', () => {
  let controller: ViajesController;
  let viajesService: jest.Mocked<ViajesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViajesController],
      providers: [
        {
          provide: ViajesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            createItinerarioItem: jest.fn(),
            updateItinerarioItem: jest.fn(),
            removeItinerarioItem: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ViajesController>(ViajesController);
    viajesService = module.get(ViajesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('controlador usa JwtAuthGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ViajesController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('POST /: llama a service.create con usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: CrearViajeDto = { destino: 'Paris', fechaInicio: '2026-06-01' };
    const creado = { id: 1 } as any;
    viajesService.create.mockResolvedValue(creado);

    const result = await controller.create(usuario, dto);

    expect(viajesService.create).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(creado);
  });

  it('GET /: llama a service.findAll con usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const viajes = [{ id: 1 }] as any;
    viajesService.findAll.mockResolvedValue(viajes);

    const result = await controller.findAll(usuario);

    expect(viajesService.findAll).toHaveBeenCalledWith(1);
    expect(result).toBe(viajes);
  });

  it('GET /:id: llama a service.findOne con id y usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const v = { id: 5 } as any;
    viajesService.findOne.mockResolvedValue(v);

    const result = await controller.findOne(usuario, 5);

    expect(viajesService.findOne).toHaveBeenCalledWith(5, 1);
    expect(result).toBe(v);
  });

  it('PATCH /:id: llama a service.update con id, usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: ActualizarViajeDto = { destino: 'Londres' };
    const actualizado = { id: 5, destino: 'Londres' } as any;
    viajesService.update.mockResolvedValue(actualizado);

    const result = await controller.update(usuario, 5, dto);

    expect(viajesService.update).toHaveBeenCalledWith(5, 1, dto);
    expect(result).toBe(actualizado);
  });

  it('DELETE /:id: llama a service.remove y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;
    viajesService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(usuario, 5);

    expect(viajesService.remove).toHaveBeenCalledWith(5, 1);
    expect(result).toEqual({ mensaje: 'Viaje eliminado correctamente' });
  });

  it('POST /:viajeId/itinerario: llama a service.createItinerarioItem', async () => {
    const usuario = { id: 1 } as any;
    const dto: CrearItinerarioItemDto = { lugar: 'Torre Eiffel' };
    const creado = { id: 10 } as any;
    viajesService.createItinerarioItem.mockResolvedValue(creado);

    const result = await controller.createItinerarioItem(usuario, 5, dto);

    expect(viajesService.createItinerarioItem).toHaveBeenCalledWith(5, 1, dto);
    expect(result).toBe(creado);
  });

  it('PATCH /:viajeId/itinerario/:itemId: llama a service.updateItinerarioItem', async () => {
    const usuario = { id: 1 } as any;
    const dto: ActualizarItinerarioItemDto = { lugar: 'Nuevo lugar' };
    const actualizado = { id: 10, lugar: 'Nuevo lugar' } as any;
    viajesService.updateItinerarioItem.mockResolvedValue(actualizado);

    const result = await controller.updateItinerarioItem(usuario, 5, 10, dto);

    expect(viajesService.updateItinerarioItem).toHaveBeenCalledWith(10, 5, 1, dto);
    expect(result).toBe(actualizado);
  });

  it('DELETE /:viajeId/itinerario/:itemId: llama a service.removeItinerarioItem', async () => {
    const usuario = { id: 1 } as any;
    viajesService.removeItinerarioItem.mockResolvedValue(undefined);

    const result = await controller.removeItinerarioItem(usuario, 5, 10);

    expect(viajesService.removeItinerarioItem).toHaveBeenCalledWith(10, 5, 1);
    expect(result).toEqual({ mensaje: 'Item eliminado correctamente' });
  });
});
