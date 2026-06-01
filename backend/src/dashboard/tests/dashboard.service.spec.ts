import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from '../dashboard.service';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Transaccion } from '../../finanzas/entities/transaccion.entity';
import { RegistroTiempo } from '../../tiempo/entities/registro-tiempo.entity';
import { Viaje } from '../../viajes/entities/viaje.entity';
import { Tarea } from '../../tareas/entities/tarea.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let proyectoRepo: jest.Mocked<Repository<Proyecto>>;
  let clienteRepo: jest.Mocked<Repository<Cliente>>;
  let transaccionRepo: jest.Mocked<Repository<Transaccion>>;
  let tiempoRepo: jest.Mocked<Repository<RegistroTiempo>>;
  let viajeRepo: jest.Mocked<Repository<Viaje>>;
  let tareaRepo: jest.Mocked<Repository<Tarea>>;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Proyecto),
          useValue: { count: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Cliente),
          useValue: { count: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Transaccion),
          useValue: { find: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(RegistroTiempo),
          useValue: { find: jest.fn(), createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) },
        },
        {
          provide: getRepositoryToken(Viaje),
          useValue: { find: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Tarea),
          useValue: { find: jest.fn(), count: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    proyectoRepo = module.get(getRepositoryToken(Proyecto));
    clienteRepo = module.get(getRepositoryToken(Cliente));
    transaccionRepo = module.get(getRepositoryToken(Transaccion));
    tiempoRepo = module.get(getRepositoryToken(RegistroTiempo));
    viajeRepo = module.get(getRepositoryToken(Viaje));
    tareaRepo = module.get(getRepositoryToken(Tarea));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getResumen: retorna datos agregados del dashboard', async () => {
    proyectoRepo.count.mockResolvedValue(3);
    clienteRepo.count.mockResolvedValue(10);
    transaccionRepo.find.mockResolvedValue([
      { tipo: 'ingreso', monto: 2000, createdAt: new Date(), categoria: 'Dev' } as Transaccion,
      { tipo: 'gasto', monto: 500, createdAt: new Date(), categoria: 'Hosting' } as Transaccion,
    ]);
    mockQueryBuilder.getRawOne.mockResolvedValue({ total: 40 });
    viajeRepo.find.mockResolvedValue([{ id: 1, destino: 'Paris' } as Viaje]);
    tareaRepo.find.mockResolvedValue([{ id: 1, titulo: 'Tarea completada', updatedAt: new Date(), proyecto: { nombre: 'Proy' } } as Tarea]);

    const result = await service.getResumen(1);

    expect(proyectoRepo.count).toHaveBeenCalledWith({
      where: { creadorId: 1, estado: 'activo' },
    });
    expect(clienteRepo.count).toHaveBeenCalledWith({
      where: { creadorId: 1 },
    });
    expect(transaccionRepo.find).toHaveBeenCalled();
    expect(viajeRepo.find).toHaveBeenCalled();
    expect(tareaRepo.find).toHaveBeenCalled();
    expect(result.proyectosActivos).toBe(3);
    expect(result.totalClientes).toBe(10);
    expect(result.resumenFinanzas.ingresos).toBe(2000);
    expect(result.resumenFinanzas.gastos).toBe(500);
    expect(result.resumenFinanzas.balance).toBe(1500);
    expect(result.horasMes).toBe(40);
    expect(result.viajesProximos).toHaveLength(1);
    expect(result.tareasPendientes).toHaveLength(1);
    expect(result.actividadReciente).toBeDefined();
  });
});
