import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../dashboard.controller';
import { DashboardService } from '../dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getResumen: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(DashboardController);
    service = module.get(DashboardService);
  });

  it('getResumen: delega en service', async () => {
    const mockResumen = {
      proyectosActivos: 3,
      totalClientes: 5,
      resumenFinanzas: { ingresos: 1000, gastos: 400, balance: 600 },
      horasMes: 20,
      viajesProximos: [],
      tareasPendientes: [],
      actividadReciente: [],
    };
    service.getResumen.mockResolvedValue(mockResumen as any);

    const result = await controller.getResumen(1);

    expect(service.getResumen).toHaveBeenCalledWith(1);
    expect(result.proyectosActivos).toBe(3);
  });
});
