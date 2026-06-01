import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProyectosService } from '../proyectos.service';
import { Proyecto } from '../entities/proyecto.entity';
import { FinanzasService } from '../../finanzas/finanzas.service';

describe('ProyectosService', () => {
  let service: ProyectosService;
  let repo: jest.Mocked<{
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    manager: { findOne: jest.Mock };
  }>;
  let finanzasService: jest.Mocked<FinanzasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyectosService,
        {
          provide: getRepositoryToken(Proyecto),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            manager: { findOne: jest.fn() },
          },
        },
        {
          provide: FinanzasService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProyectosService);
    repo = module.get(getRepositoryToken(Proyecto));
    finanzasService = module.get(FinanzasService);
  });

  it('create: crea proyecto con creadorId', async () => {
    const dto = { nombre: 'Proyecto Test' } as any;
    repo.create.mockReturnValue({ ...dto, creadorId: 1 } as Proyecto);
    repo.save.mockResolvedValue({ id: 1, ...dto, creadorId: 1 } as Proyecto);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(result.id).toBe(1);
  });

  it('findAll: retorna proyectos del usuario', async () => {
    const proyectos = [{ id: 1, nombre: 'P1' }] as Proyecto[];
    repo.find.mockResolvedValue(proyectos);

    const result = await service.findAll(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { creadorId: 1 },
      order: { updatedAt: 'DESC' },
      relations: ['tareas', 'clienteRel'],
    });
    expect(result).toBe(proyectos);
  });

  it('findOne: retorna proyecto si existe', async () => {
    const proyecto = { id: 1, creadorId: 1 } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);

    const result = await service.findOne(1, 1);

    expect(result).toBe(proyecto);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza y registra ganancia si estado pasa a completado', async () => {
    const proyecto = { id: 1, creadorId: 1, estado: 'activo', ganancia: 500, nombre: 'P1', clienteId: 2 } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);
    repo.save.mockResolvedValue({ ...proyecto, estado: 'completado' } as Proyecto);
    finanzasService.create.mockResolvedValue({ id: 1 } as any);

    await service.update(1, 1, { estado: 'completado' } as any);

    expect(finanzasService.create).toHaveBeenCalledWith(1, {
      tipo: 'ingreso',
      categoria: 'Desarrollo',
      monto: 500,
      moneda: 'USD',
      descripcion: 'Ganancia del proyecto: P1',
      fecha: expect.any(String),
      proyectoId: 1,
      clienteId: 2,
    });
  });

  it('update: no registra ganancia si estado no cambia a completado', async () => {
    const proyecto = { id: 1, creadorId: 1, estado: 'activo' } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);
    repo.save.mockResolvedValue({ ...proyecto, estado: 'en_pausa' } as Proyecto);

    await service.update(1, 1, { estado: 'en_pausa' } as any);

    expect(finanzasService.create).not.toHaveBeenCalled();
  });

  it('remove: elimina proyecto existente', async () => {
    const proyecto = { id: 1, creadorId: 1 } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(proyecto);
  });
});
