import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportesService } from '../reportes.service';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';
import { Transaccion } from '../../finanzas/entities/transaccion.entity';
import { RegistroTiempo } from '../../tiempo/entities/registro-tiempo.entity';
import { Tarea } from '../../tareas/entities/tarea.entity';
import { DivisasService } from '../../divisas/divisas.service';

describe('ReportesService', () => {
  let service: ReportesService;
  let proyectoRepo: { findOne: jest.Mock };
  let transaccionRepo: { find: jest.Mock };
  let tiempoRepo: { find: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesService,
        { provide: getRepositoryToken(Proyecto), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Transaccion), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(RegistroTiempo), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(Tarea), useValue: {} },
        { provide: DivisasService, useValue: { validarMoneda: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn(() => '') } },
      ],
    }).compile();

    service = module.get(ReportesService);
    proyectoRepo = module.get(getRepositoryToken(Proyecto));
    transaccionRepo = module.get(getRepositoryToken(Transaccion));
    tiempoRepo = module.get(getRepositoryToken(RegistroTiempo));
  });

  it('genera un PDF (Buffer) para un proyecto con datos', async () => {
    proyectoRepo.findOne.mockResolvedValue({
      nombre: 'P1',
      estado: 'activo',
      prioridad: 'alta',
      clienteRel: { nombre: 'C1' },
      creador: { nombre: 'Yo' },
      moneda: 'USD',
      tareas: [
        { id: 1, titulo: 'T1', estado: 'completada', prioridad: 'alta' },
        { id: 2, titulo: 'T2', estado: 'pendiente', prioridad: 'baja' },
      ],
    });
    transaccionRepo.find.mockResolvedValue([
      { id: 1, tipo: 'ingreso', monto: 100, categoria: 'Desarrollo', fecha: '2026-01-01', moneda: 'USD' },
      { id: 2, tipo: 'gasto', monto: 30, categoria: 'Comida', fecha: '2026-01-02', moneda: 'USD' },
    ]);
    tiempoRepo.find.mockResolvedValue([{ horas: 5, fecha: '2026-01-03' }]);

    const buffer = await service.generarReporteProyecto(1, 1, 'USD');

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('rechaza si el proyecto no existe o no es del usuario', async () => {
    proyectoRepo.findOne.mockResolvedValue(null);

    await expect(service.generarReporteProyecto(1, 1)).rejects.toThrow('Proyecto no encontrado');
  });
});
