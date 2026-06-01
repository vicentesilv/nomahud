import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TareasService } from '../tareas.service';
import { Tarea } from '../entities/tarea.entity';
import { TiempoService } from '../../tiempo/tiempo.service';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';

describe('TareasService', () => {
  let service: TareasService;
  let repo: jest.Mocked<{
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    manager: { findOne: jest.Mock };
  }>;
  let tiempoService: jest.Mocked<TiempoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TareasService,
        {
          provide: getRepositoryToken(Tarea),
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
          provide: TiempoService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TareasService);
    repo = module.get(getRepositoryToken(Tarea));
    tiempoService = module.get(TiempoService);
  });

  it('create: crea tarea', async () => {
    const dto = { titulo: 'Tarea 1', proyectoId: 1 } as any;
    repo.create.mockReturnValue(dto as Tarea);
    repo.save.mockResolvedValue({ id: 1, ...dto } as Tarea);

    const result = await service.create(dto);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe(1);
  });

  it('findAllByProyecto: retorna tareas del proyecto', async () => {
    const tareas = [{ id: 1 }] as Tarea[];
    repo.find.mockResolvedValue(tareas);

    const result = await service.findAllByProyecto(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { proyectoId: 1 },
      order: { createdAt: 'ASC' },
      relations: ['asignadoA'],
    });
    expect(result).toBe(tareas);
  });

  it('findAll: retorna tareas del usuario', async () => {
    const tareas = [{ id: 1 }] as Tarea[];
    repo.find.mockResolvedValue(tareas);

    const result = await service.findAll(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { proyecto: { creadorId: 1 } },
      relations: ['proyecto', 'asignadoA'],
      order: { createdAt: 'ASC' },
    });
    expect(result).toBe(tareas);
  });

  it('findOne: retorna tarea si existe', async () => {
    const tarea = { id: 1 } as Tarea;
    repo.findOne.mockResolvedValue(tarea);

    const result = await service.findOne(1);

    expect(result).toBe(tarea);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: registra tiempo si tarea pasa a completada', async () => {
    const proyecto = { id: 1, creadorId: 1 } as Proyecto;
    const tarea = {
      id: 1,
      titulo: 'Tarea 1',
      proyectoId: 1,
      estado: 'pendiente',
      estimacionHoras: 5,
      autoTiempoRegistrado: false,
    } as Tarea;

    repo.findOne.mockResolvedValue(tarea);
    repo.save.mockResolvedValue({ ...tarea, estado: 'completada', autoTiempoRegistrado: true } as Tarea);
    repo.manager.findOne.mockResolvedValue(proyecto);

    await service.update(1, { estado: 'completada' } as any);

    expect(repo.manager.findOne).toHaveBeenCalledWith(Proyecto, {
      where: { id: 1 },
      select: ['creadorId'],
    });
    expect(tiempoService.create).toHaveBeenCalledWith(1, {
      proyectoId: 1,
      tareaId: 1,
      horas: 5,
      fecha: expect.any(String),
      descripcion: 'Tarea completada: Tarea 1',
    });
  });

  it('update: no registra tiempo si estado no cambia a completada', async () => {
    const tarea = { id: 1, estado: 'pendiente', proyectoId: 1 } as Tarea;
    repo.findOne.mockResolvedValue(tarea);
    repo.save.mockResolvedValue({ ...tarea, estado: 'en_progreso' } as Tarea);

    await service.update(1, { estado: 'en_progreso' } as any);

    expect(tiempoService.create).not.toHaveBeenCalled();
  });

  it('remove: elimina tarea existente', async () => {
    const tarea = { id: 1 } as Tarea;
    repo.findOne.mockResolvedValue(tarea);

    await service.remove(1);

    expect(repo.remove).toHaveBeenCalledWith(tarea);
  });
});
