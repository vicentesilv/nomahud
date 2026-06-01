import { Test, TestingModule } from '@nestjs/testing';
import { FinanzasController } from '../finanzas.controller';
import { FinanzasService } from '../finanzas.service';

describe('FinanzasController', () => {
  let controller: FinanzasController;
  let service: jest.Mocked<FinanzasService>;

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

    controller = module.get(FinanzasController);
    service = module.get(FinanzasService);
  });

  it('create: delega en service', async () => {
    const usuario = { id: 1 } as any;
    const dto = { tipo: 'ingreso', categoria: 'Ventas', monto: 500, fecha: '2026-06-01' } as any;
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
    service.getResumen.mockResolvedValue({ totalIngresos: 0, totalGastos: 0, balance: 0, ingresos: 0, gastos: 0 });

    const result = await controller.getResumen(usuario);

    expect(service.getResumen).toHaveBeenCalledWith(1);
    expect(result.balance).toBe(0);
  });

  it('findOne: delega en service', async () => {
    const usuario = { id: 1 } as any;
    service.findOne.mockResolvedValue({ id: 5 } as any);

    await controller.findOne(usuario, 5);

    expect(service.findOne).toHaveBeenCalledWith(5, 1);
  });

  it('update: delega en service', async () => {
    const usuario = { id: 1 } as any;
    const dto = { monto: 999 } as any;
    service.update.mockResolvedValue({ id: 1 } as any);

    await controller.update(usuario, 1, dto);

    expect(service.update).toHaveBeenCalledWith(1, 1, dto);
  });

  it('remove: elimina y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;

    const result = await controller.remove(usuario, 1);

    expect(service.remove).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual({ mensaje: 'Transacción eliminada correctamente' });
  });
});
