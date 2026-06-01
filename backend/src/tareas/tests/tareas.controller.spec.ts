import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { TareasController } from '../tareas.controller';
import { TareasService } from '../tareas.service';
import { CrearTareaDto } from '../dtos/crear-tarea.dto';
import { ActualizarTareaDto } from '../dtos/actualizar-tarea.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('TareasController', () => {
  let controller: TareasController;
  let tareasService: jest.Mocked<TareasService>;

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

    controller = module.get<TareasController>(TareasController);
    tareasService = module.get(TareasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('controlador usa JwtAuthGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, TareasController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('POST /: llama a service.create con dto', async () => {
    const dto: CrearTareaDto = { titulo: 'Tarea 1', proyectoId: 1 };
    const creada = { id: 1 } as any;
    tareasService.create.mockResolvedValue(creada);

    const result = await controller.create(dto);

    expect(tareasService.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(creada);
  });

  it('GET /: llama a service.findAll con userId del decorador', async () => {
    const tareas = [{ id: 1 }] as any;
    tareasService.findAll.mockResolvedValue(tareas);

    const result = await controller.findAll(1);

    expect(tareasService.findAll).toHaveBeenCalledWith(1);
    expect(result).toBe(tareas);
  });

  it('GET /proyecto/:proyectoId: llama a service.findAllByProyecto', async () => {
    const tareas = [{ id: 1 }] as any;
    tareasService.findAllByProyecto.mockResolvedValue(tareas);

    const result = await controller.findAllByProyecto(5);

    expect(tareasService.findAllByProyecto).toHaveBeenCalledWith(5);
    expect(result).toBe(tareas);
  });

  it('GET /:id: llama a service.findOne con id', async () => {
    const t = { id: 5 } as any;
    tareasService.findOne.mockResolvedValue(t);

    const result = await controller.findOne(5);

    expect(tareasService.findOne).toHaveBeenCalledWith(5);
    expect(result).toBe(t);
  });

  it('PATCH /:id: llama a service.update con id y dto', async () => {
    const dto: ActualizarTareaDto = { estado: 'completada' };
    const actualizada = { id: 5, estado: 'completada' } as any;
    tareasService.update.mockResolvedValue(actualizada);

    const result = await controller.update(5, dto);

    expect(tareasService.update).toHaveBeenCalledWith(5, dto);
    expect(result).toBe(actualizada);
  });

  it('DELETE /:id: llama a service.remove y retorna mensaje', async () => {
    tareasService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(5);

    expect(tareasService.remove).toHaveBeenCalledWith(5);
    expect(result).toEqual({ mensaje: 'Tarea eliminada correctamente' });
  });
});
