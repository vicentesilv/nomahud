import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from '../dashboard.service';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Transaccion } from '../../finanzas/entities/transaccion.entity';
import { RegistroTiempo } from '../../tiempo/entities/registro-tiempo.entity';
import { Viaje } from '../../viajes/entities/viaje.entity';
import { Tarea } from '../../tareas/entities/tarea.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let proyectoRepo: jest.Mocked<{ count: jest.Mock }>;
  let clienteRepo: jest.Mocked<{ count: jest.Mock }>;
  let transaccionRepo: jest.Mocked<{ find: jest.Mock }>;
  let tiempoRepo: jest.Mocked<{ createQueryBuilder: jest.Mock }>;
  let viajeRepo: jest.Mocked<{ find: jest.Mock }>;
  let tareaRepo: jest.Mocked<{ find: jest.Mock }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Proyecto),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Cliente),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Transaccion),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(RegistroTiempo),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Viaje),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Tarea),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
    proyectoRepo = module.get(getRepositoryToken(Proyecto));
    clienteRepo = module.get(getRepositoryToken(Cliente));
    transaccionRepo = module.get(getRepositoryToken(Transaccion));
    tiempoRepo = module.get(getRepositoryToken(RegistroTiempo));
    viajeRepo = module.get(getRepositoryToken(Viaje));
    tareaRepo = module.get(getRepositoryToken(Tarea));
  });

  it('getResumen: retorta estadisticas completas', async () => {
    proyectoRepo.count.mockResolvedValue(3);
    clienteRepo.count.mockResolvedValue(5);
    const now = new Date();
    transaccionRepo.find.mockResolvedValue([
      { id: 1, tipo: 'ingreso', monto: 1000, categoria: 'Ventas', createdAt: now } as Transaccion,
      { id: 2, tipo: 'gasto', monto: 400, categoria: 'Comida', createdAt: now } as Transaccion,
    ]);

    const queryBuilderMock = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: 20 }),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    };
    tiempoRepo.createQueryBuilder.mockReturnValue(queryBuilderMock as any);

    viajeRepo.find.mockResolvedValue([]);
    tareaRepo.find.mockResolvedValue([]);

    const result = await service.getResumen(1);

    expect(result.proyectosActivos).toBe(3);
    expect(result.totalClientes).toBe(5);
    expect(result.resumenFinanzas).toEqual({
      ingresos: 1000,
      gastos: 400,
      balance: 600,
    });
    expect(result.horasMes).toBe(20);
    expect(result.viajesProximos).toEqual([]);
    expect(result.tareasPendientes).toEqual([]);
    expect(Array.isArray(result.actividadReciente)).toBe(true);
  });
});
