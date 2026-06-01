import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { TiempoController } from '../tiempo.controller';
import { TiempoService } from '../tiempo.service';
import { CrearRegistroTiempoDto } from '../dtos/crear-registro-tiempo.dto';
import { ActualizarRegistroTiempoDto } from '../dtos/actualizar-registro-tiempo.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('TiempoController', () => {
  let controller: TiempoController;
  let tiempoService: jest.Mocked<TiempoService>;

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

    controller = module.get<TiempoController>(TiempoController);
    tiempoService = module.get(TiempoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('controlador usa JwtAuthGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, TiempoController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('POST /: llama a service.create con usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: CrearRegistroTiempoDto = { proyectoId: 1, horas: 5, fecha: '2026-05-01' };
    const creado = { id: 1 } as any;
    tiempoService.create.mockResolvedValue(creado);

    const result = await controller.create(usuario, dto);

    expect(tiempoService.create).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(creado);
  });

  it('GET /: llama a service.findAll con usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const registros = [{ id: 1 }] as any;
    tiempoService.findAll.mockResolvedValue(registros);

    const result = await controller.findAll(usuario);

    expect(tiempoService.findAll).toHaveBeenCalledWith(1);
    expect(result).toBe(registros);
  });

  it('GET /resumen: llama a service.getResumen con usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const resumen = { totalHoras: 100, registrosHoy: 3 } as any;
    tiempoService.getResumen.mockResolvedValue(resumen);

    const result = await controller.getResumen(usuario);

    expect(tiempoService.getResumen).toHaveBeenCalledWith(1);
    expect(result).toBe(resumen);
  });

  it('GET /:id: llama a service.findOne con id y usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const r = { id: 5 } as any;
    tiempoService.findOne.mockResolvedValue(r);

    const result = await controller.findOne(usuario, 5);

    expect(tiempoService.findOne).toHaveBeenCalledWith(5, 1);
    expect(result).toBe(r);
  });

  it('PATCH /:id: llama a service.update con id, usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: ActualizarRegistroTiempoDto = { horas: 8 };
    const actualizado = { id: 5, horas: 8 } as any;
    tiempoService.update.mockResolvedValue(actualizado);

    const result = await controller.update(usuario, 5, dto);

    expect(tiempoService.update).toHaveBeenCalledWith(5, 1, dto);
    expect(result).toBe(actualizado);
  });

  it('DELETE /:id: llama a service.remove y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;
    tiempoService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(usuario, 5);

    expect(tiempoService.remove).toHaveBeenCalledWith(5, 1);
    expect(result).toEqual({ mensaje: 'Registro eliminado correctamente' });
  });
});
