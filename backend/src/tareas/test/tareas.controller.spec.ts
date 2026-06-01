import { Test, TestingModule } from '@nestjs/testing';
import { TareasController } from '../tareas.controller';
import { TareasService } from '../tareas.service';

describe('TareasController', () => {
  let controller: TareasController;
  let service: jest.Mocked<TareasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TareasController],
      providers: [
        {
          provide: TareasService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllByProyecto: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TareasController);
    service = module.get(TareasService);
  });

  it('create: delega en service', async () => {
    const dto = { titulo: 'Tarea', proyectoId: 1 } as any;
    service.create.mockResolvedValue({ id: 1 } as any);

    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll: delega en service con userId', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll(1);

    expect(service.findAll).toHaveBeenCalledWith(1);
  });

  it('findAllByProyecto: delega en service', async () => {
    service.findAllByProyecto.mockResolvedValue([]);

    await controller.findAllByProyecto(5);

    expect(service.findAllByProyecto).toHaveBeenCalledWith(5);
  });

  it('findOne: delega en service', async () => {
    service.findOne.mockResolvedValue({ id: 1 } as any);

    await controller.findOne(1);

    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('update: delega en service', async () => {
    const dto = { titulo: 'Actualizado' } as any;
    service.update.mockResolvedValue({ id: 1 } as any);

    await controller.update(1, dto);

    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('remove: elimina y retorna mensaje', async () => {
    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ mensaje: 'Tarea eliminada correctamente' });
  });
});
