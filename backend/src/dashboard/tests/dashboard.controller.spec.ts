import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DashboardController } from '../dashboard.controller';
import { DashboardService } from '../dashboard.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<DashboardService>;

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

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('controlador usa JwtAuthGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, DashboardController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('GET /: llama a service.getResumen con userId del decorador', async () => {
    const resumen = { proyectosActivos: 3 } as any;
    dashboardService.getResumen.mockResolvedValue(resumen);

    const result = await controller.getResumen(1);

    expect(dashboardService.getResumen).toHaveBeenCalledWith(1);
    expect(result).toBe(resumen);
  });
});
