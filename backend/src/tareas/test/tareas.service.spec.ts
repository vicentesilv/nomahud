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
    findAndCount: jest.Mock;
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
            findAndCount: jest.fn(),
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
    repo.manager.findOne.mockResolvedValue({ id: 1, creadorId: 7 } as Proyecto);

    const result = await service.create(7, dto);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe(1);
  });

  it('create: rechaza proyecto ajeno', async () => {
    repo.manager.findOne.mockResolvedValue(null);

    await expect(service.create(7, { titulo: 'X', proyectoId: 99 } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findAllByProyecto: retorna tareas del proyecto', async () => {
    const tareas = [{ id: 1 }] as Tarea[];
    repo.manager.findOne.mockResolvedValue({ id: 1, creadorId: 7 } as Proyecto);
    repo.find.mockResolvedValue(tareas);

    const result = await service.findAllByProyecto(1, 7);

    expect(repo.find).toHaveBeenCalledWith({
      where: { proyectoId: 1 },
      order: { createdAt: 'ASC' },
      relations: ['asignadoA'],
    });
    expect(result).toBe(tareas);
  });

  it('findAll: retorna tareas del usuario', async () => {
    const tareas = [{ id: 1 }] as Tarea[];
    repo.findAndCount.mockResolvedValue([tareas, 1]);

    const result = await service.findAll(1);

    expect(repo.findAndCount).toHaveBeenCalledWith({
      where: [{ proyecto: { creadorId: 1 } }, { proyecto: { miembros: { usuarioId: 1 } } }],
      relations: ['proyecto', 'asignadoA'],
      order: { createdAt: 'ASC' },
      skip: 0,
      take: 20,
    });
    expect(result).toEqual({ datos: tareas, total: 1, pagina: 1, limite: 20 });
  });

  it('findOne: retorna tarea si existe', async () => {
    const tarea = { id: 1, proyectoId: 1 } as Tarea;
    repo.findOne.mockResolvedValue(tarea);
    repo.manager.findOne.mockResolvedValue({ id: 1, creadorId: 7 } as Proyecto);

    const result = await service.findOne(1, 7);

    expect(result).toBe(tarea);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: registra tiempo si tarea pasa a completada', async () => {
    const proyecto = { id: 1, creadorId: 7 } as Proyecto;
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

    await service.update(1, 7, { estado: 'completada' } as any);

    expect(repo.manager.findOne).toHaveBeenCalledWith(Proyecto, {
      where: { id: 1 },
      select: ['id', 'creadorId'],
    });
    expect(tiempoService.create).toHaveBeenCalledWith(7, {
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
    repo.manager.findOne.mockResolvedValue({ id: 1, creadorId: 7 } as Proyecto);

    await service.update(1, 7, { estado: 'en_progreso' } as any);

    expect(tiempoService.create).not.toHaveBeenCalled();
  });

  it('remove: elimina tarea existente', async () => {
    const tarea = { id: 1, proyectoId: 1 } as Tarea;
    repo.findOne.mockResolvedValue(tarea);
    repo.manager.findOne.mockResolvedValue({ id: 1, creadorId: 7 } as Proyecto);

    await service.remove(1, 7);

    expect(repo.remove).toHaveBeenCalledWith(tarea);
  });

  it('lector: puede leer pero no escribir', async () => {
    const tarea = { id: 1, proyectoId: 1 } as Tarea;
    repo.findOne.mockResolvedValue(tarea);
    repo.manager.findOne.mockImplementation(async (entidad: unknown) => {
      if (entidad === Proyecto) return { id: 1, creadorId: 99 } as Proyecto;
      return { proyectoId: 1, usuarioId: 7, rol: 'lector' };
    });

    const leida = await service.findOne(1, 7);
    expect(leida).toBe(tarea);
    await expect(service.update(1, 7, { titulo: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(1, 7)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.create(7, { titulo: 'Y', proyectoId: 1 } as any)).rejects.toBeInstanceOf(NotFoundException);
  });
});
