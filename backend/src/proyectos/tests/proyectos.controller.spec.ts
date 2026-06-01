import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ProyectosController } from '../proyectos.controller';
import { ProyectosService } from '../proyectos.service';
import { CrearProyectoDto } from '../dtos/crear-proyecto.dto';
import { ActualizarProyectoDto } from '../dtos/actualizar-proyecto.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('ProyectosController', () => {
  let controller: ProyectosController;
  let proyectosService: jest.Mocked<ProyectosService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProyectosController],
      providers: [
        {
          provide: ProyectosService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProyectosController>(ProyectosController);
    proyectosService = module.get(ProyectosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('controlador usa JwtAuthGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ProyectosController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('POST /: llama a service.create con usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: CrearProyectoDto = { nombre: 'Proy 1', prioridad: 'alta' };
    const creado = { id: 1 } as any;
    proyectosService.create.mockResolvedValue(creado);

    const result = await controller.create(usuario, dto);

    expect(proyectosService.create).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(creado);
  });

  it('GET /: llama a service.findAll con usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const proyectos = [{ id: 1 }] as any;
    proyectosService.findAll.mockResolvedValue(proyectos);

    const result = await controller.findAll(usuario);

    expect(proyectosService.findAll).toHaveBeenCalledWith(1);
    expect(result).toBe(proyectos);
  });

  it('GET /:id: llama a service.findOne con id y usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const p = { id: 5 } as any;
    proyectosService.findOne.mockResolvedValue(p);

    const result = await controller.findOne(usuario, 5);

    expect(proyectosService.findOne).toHaveBeenCalledWith(5, 1);
    expect(result).toBe(p);
  });

  it('PATCH /:id: llama a service.update con id, usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: ActualizarProyectoDto = { nombre: 'Actualizado' };
    const actualizado = { id: 5, nombre: 'Actualizado' } as any;
    proyectosService.update.mockResolvedValue(actualizado);

    const result = await controller.update(usuario, 5, dto);

    expect(proyectosService.update).toHaveBeenCalledWith(5, 1, dto);
    expect(result).toBe(actualizado);
  });

  it('DELETE /:id: llama a service.remove y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;
    proyectosService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(usuario, 5);

    expect(proyectosService.remove).toHaveBeenCalledWith(5, 1);
    expect(result).toEqual({ mensaje: 'Proyecto eliminado correctamente' });
  });
});
