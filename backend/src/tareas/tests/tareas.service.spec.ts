import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { TareasService } from '../tareas.service';
import { Tarea } from '../entities/tarea.entity';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';
import { CrearTareaDto } from '../dtos/crear-tarea.dto';
import { ActualizarTareaDto } from '../dtos/actualizar-tarea.dto';
import { TiempoService } from '../../tiempo/tiempo.service';

describe('TareasService', () => {
  let service: TareasService;
  let repo: jest.Mocked<Repository<Tarea>>;
  let tiempoService: jest.Mocked<TiempoService>;
  let mockManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TareasService,
        {
          provide: getRepositoryToken(Tarea),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            manager: mockManager,
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

    service = module.get<TareasService>(TareasService);
    repo = module.get(getRepositoryToken(Tarea));
    tiempoService = module.get(TiempoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create: crea y guarda tarea', async () => {
    const dto: CrearTareaDto = { titulo: 'Tarea 1', proyectoId: 1 };
    const creada = { id: 1, ...dto } as Tarea;
    repo.create.mockReturnValue(creada);
    repo.save.mockResolvedValue(creada);

    const result = await service.create(dto);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(creada);
    expect(result).toBe(creada);
  });

  it('findAllByProyecto: retorna tareas del proyecto', async () => {
    const tareas = [{ id: 1 }, { id: 2 }] as Tarea[];
    repo.find.mockResolvedValue(tareas);

    const result = await service.findAllByProyecto(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { proyectoId: 1 },
      order: { createdAt: 'ASC' },
      relations: ['asignadoA'],
    });
    expect(result).toBe(tareas);
  });

  it('findAll: retorna tareas por userId via proyecto.creadorId', async () => {
    const tareas = [{ id: 1 }, { id: 2 }] as Tarea[];
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
    const t = { id: 1 } as Tarea;
    repo.findOne.mockResolvedValue(t);

    const result = await service.findOne(1);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['asignadoA'],
    });
    expect(result).toBe(t);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza tarea existente', async () => {
    const existente = { id: 1, titulo: 'Vieja', estado: 'pendiente' as const } as Tarea;
    const dto: ActualizarTareaDto = { titulo: 'Nueva' };
    const guardada = { ...existente, titulo: 'Nueva' } as Tarea;

    repo.findOne.mockResolvedValue(existente);
    repo.save.mockResolvedValue(guardada);

    const result = await service.update(1, dto);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['asignadoA'],
    });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Nueva' }));
    expect(result).toBe(guardada);
  });

  it('update: registra tiempo automaticamente al completar tarea', async () => {
    const existente = {
      id: 1, titulo: 'Tarea', estado: 'pendiente' as const,
      proyectoId: 1, estimacionHoras: 5, autoTiempoRegistrado: false,
    } as Tarea;
    const dto: ActualizarTareaDto = { estado: 'completada' };
    const guardada = {
      ...existente, estado: 'completada' as const, autoTiempoRegistrado: false,
    } as Tarea;

    repo.findOne.mockResolvedValue(existente);
    mockManager.findOne.mockResolvedValue({ creadorId: 1 });
    repo.save.mockResolvedValue(guardada);

    await service.update(1, dto);

    expect(mockManager.findOne).toHaveBeenCalledWith(Proyecto, {
      where: { id: 1 },
      select: ['creadorId'],
    });
    expect(tiempoService.create).toHaveBeenCalledWith(1, {
      proyectoId: 1,
      tareaId: 1,
      horas: 5,
      fecha: expect.any(String),
      descripcion: 'Tarea completada: Tarea',
    });
    expect(repo.save).toHaveBeenCalled();
  });

  it('update: no registra tiempo si no hay proyectoId', async () => {
    const existente = {
      id: 1, titulo: 'Tarea', estado: 'pendiente' as const,
      proyectoId: null, autoTiempoRegistrado: false,
    } as any;
    const dto: ActualizarTareaDto = { estado: 'completada' };

    repo.findOne.mockResolvedValue(existente);
    repo.save.mockResolvedValue(existente);

    await service.update(1, dto);

    expect(tiempoService.create).not.toHaveBeenCalled();
  });

  it('remove: elimina tarea si existe', async () => {
    const t = { id: 1 } as Tarea;
    repo.findOne.mockResolvedValue(t);
    repo.remove.mockResolvedValue(t);

    await service.remove(1);

    expect(repo.remove).toHaveBeenCalledWith(t);
  });
});
