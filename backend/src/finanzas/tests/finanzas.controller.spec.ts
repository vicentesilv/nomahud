import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { FinanzasController } from '../finanzas.controller';
import { FinanzasService } from '../finanzas.service';
import { CrearTransaccionDto } from '../dtos/crear-transaccion.dto';
import { ActualizarTransaccionDto } from '../dtos/actualizar-transaccion.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('FinanzasController', () => {
  let controller: FinanzasController;
  let finanzasService: jest.Mocked<FinanzasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanzasController],
      providers: [
        {
          provide: FinanzasService,
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

    controller = module.get<FinanzasController>(FinanzasController);
    finanzasService = module.get(FinanzasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('controlador usa JwtAuthGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, FinanzasController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('POST /: llama a service.create con usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: CrearTransaccionDto = { tipo: 'ingreso', categoria: 'Dev', monto: 500, fecha: '2026-05-01' };
    const creada = { id: 1 } as any;
    finanzasService.create.mockResolvedValue(creada);

    const result = await controller.create(usuario, dto);

    expect(finanzasService.create).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(creada);
  });

  it('GET /: llama a service.findAll con usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const transacciones = [{ id: 1 }] as any;
    finanzasService.findAll.mockResolvedValue(transacciones);

    const result = await controller.findAll(usuario);

    expect(finanzasService.findAll).toHaveBeenCalledWith(1);
    expect(result).toBe(transacciones);
  });

  it('GET /resumen: llama a service.getResumen con usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const resumen = { totalIngresos: 1000, totalGastos: 500, balance: 500 } as any;
    finanzasService.getResumen.mockResolvedValue(resumen);

    const result = await controller.getResumen(usuario);

    expect(finanzasService.getResumen).toHaveBeenCalledWith(1);
    expect(result).toBe(resumen);
  });

  it('GET /:id: llama a service.findOne con id y usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const t = { id: 5 } as any;
    finanzasService.findOne.mockResolvedValue(t);

    const result = await controller.findOne(usuario, 5);

    expect(finanzasService.findOne).toHaveBeenCalledWith(5, 1);
    expect(result).toBe(t);
  });

  it('PATCH /:id: llama a service.update con id, usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: ActualizarTransaccionDto = { monto: 2000 };
    const actualizada = { id: 5, monto: 2000 } as any;
    finanzasService.update.mockResolvedValue(actualizada);

    const result = await controller.update(usuario, 5, dto);

    expect(finanzasService.update).toHaveBeenCalledWith(5, 1, dto);
    expect(result).toBe(actualizada);
  });

  it('DELETE /:id: llama a service.remove y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;
    finanzasService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(usuario, 5);

    expect(finanzasService.remove).toHaveBeenCalledWith(5, 1);
    expect(result).toEqual({ mensaje: 'Transacción eliminada correctamente' });
  });
});
