import { Test, TestingModule } from '@nestjs/testing';
import { ViajesController } from '../viajes.controller';
import { ViajesService } from '../viajes.service';

describe('ViajesController', () => {
  let controller: ViajesController;
  let service: jest.Mocked<ViajesService>;

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

    controller = module.get(ViajesController);
    service = module.get(ViajesService);
  });

  const usuario = { id: 1 } as any;

  it('create: delega en service', async () => {
    const dto = { destino: 'Paris', fechaInicio: '2026-07-01' } as any;
    service.create.mockResolvedValue({ id: 1 } as any);

    await controller.create(usuario, dto);

    expect(service.create).toHaveBeenCalledWith(1, dto);
  });

  it('findAll: delega en service', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll(usuario);

    expect(service.findAll).toHaveBeenCalledWith(1);
  });

  it('findOne: delega en service', async () => {
    service.findOne.mockResolvedValue({ id: 5 } as any);

    await controller.findOne(usuario, 5);

    expect(service.findOne).toHaveBeenCalledWith(5, 1);
  });

  it('update: delega en service', async () => {
    const dto = { destino: 'Londres' } as any;
    service.update.mockResolvedValue({ id: 1 } as any);

    await controller.update(usuario, 1, dto);

    expect(service.update).toHaveBeenCalledWith(1, 1, dto);
  });

  it('remove: elimina y retorna mensaje', async () => {
    const result = await controller.remove(usuario, 1);

    expect(service.remove).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual({ mensaje: 'Viaje eliminado correctamente' });
  });

  it('createItinerarioItem: delega en service', async () => {
    const dto = { lugar: 'Torre Eiffel' } as any;
    service.createItinerarioItem.mockResolvedValue({ id: 1 } as any);

    await controller.createItinerarioItem(usuario, 1, dto);

    expect(service.createItinerarioItem).toHaveBeenCalledWith(1, 1, dto);
  });

  it('updateItinerarioItem: delega en service', async () => {
    const dto = { lugar: 'Louvre' } as any;
    service.updateItinerarioItem.mockResolvedValue({ id: 1 } as any);

    await controller.updateItinerarioItem(usuario, 1, 1, dto);

    expect(service.updateItinerarioItem).toHaveBeenCalledWith(1, 1, 1, dto);
  });

  it('removeItinerarioItem: elimina y retorna mensaje', async () => {
    const result = await controller.removeItinerarioItem(usuario, 1, 1);

    expect(service.removeItinerarioItem).toHaveBeenCalledWith(1, 1, 1);
    expect(result).toEqual({ mensaje: 'Item eliminado correctamente' });
  });
});
