import { Test, TestingModule } from '@nestjs/testing';
import { TiempoController } from '../tiempo.controller';
import { TiempoService } from '../tiempo.service';

describe('TiempoController', () => {
  let controller: TiempoController;
  let service: jest.Mocked<TiempoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiempoController],
      providers: [
        {
          provide: TiempoService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getResumen: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TiempoController);
    service = module.get(TiempoService);
  });

  it('create: delega en service', async () => {
    const usuario = { id: 1 } as any;
    const dto = { proyectoId: 1, horas: 5, fecha: '2026-06-01' } as any;
    service.create.mockResolvedValue({ id: 1 } as any);

    await controller.create(usuario, dto);

    expect(service.create).toHaveBeenCalledWith(1, dto);
  });

  it('findAll: delega en service', async () => {
    const usuario = { id: 1 } as any;
    service.findAll.mockResolvedValue([]);

    await controller.findAll(usuario);

    expect(service.findAll).toHaveBeenCalledWith(1);
  });

  it('getResumen: delega en service', async () => {
    const usuario = { id: 1 } as any;
    service.getResumen.mockResolvedValue({ totalHoras: 10, registrosHoy: 2 });

    const result = await controller.getResumen(usuario);

    expect(service.getResumen).toHaveBeenCalledWith(1);
    expect(result.totalHoras).toBe(10);
  });

  it('findOne: delega en service', async () => {
    const usuario = { id: 1 } as any;
    service.findOne.mockResolvedValue({ id: 5 } as any);

    await controller.findOne(usuario, 5);

    expect(service.findOne).toHaveBeenCalledWith(5, 1);
  });

  it('update: delega en service', async () => {
    const usuario = { id: 1 } as any;
    const dto = { horas: 8 } as any;
    service.update.mockResolvedValue({ id: 1 } as any);

    await controller.update(usuario, 1, dto);

    expect(service.update).toHaveBeenCalledWith(1, 1, dto);
  });

  it('remove: elimina y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;

    const result = await controller.remove(usuario, 1);

    expect(service.remove).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual({ mensaje: 'Registro eliminado correctamente' });
  });
});
