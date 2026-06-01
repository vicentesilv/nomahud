import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProyectosService } from '../proyectos.service';
import { Proyecto } from '../entities/proyecto.entity';
import { CrearProyectoDto } from '../dtos/crear-proyecto.dto';
import { ActualizarProyectoDto } from '../dtos/actualizar-proyecto.dto';
import { FinanzasService } from '../../finanzas/finanzas.service';

describe('ProyectosService', () => {
  let service: ProyectosService;
  let repo: jest.Mocked<Repository<Proyecto>>;
  let finanzasService: jest.Mocked<FinanzasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyectosService,
        {
          provide: getRepositoryToken(Proyecto),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
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

    service = module.get<ProyectosService>(ProyectosService);
    repo = module.get(getRepositoryToken(Proyecto));
    finanzasService = module.get(FinanzasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create: crea y guarda proyecto con creadorId', async () => {
    const dto: CrearProyectoDto = { nombre: 'Proyecto 1', prioridad: 'media' };
    const creado = { id: 1, ...dto, creadorId: 1 } as Proyecto;
    repo.create.mockReturnValue(creado);
    repo.save.mockResolvedValue(creado);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(repo.save).toHaveBeenCalledWith(creado);
    expect(result).toBe(creado);
  });

  it('findAll: retorna proyectos del creador con relaciones', async () => {
    const proyectos = [{ id: 1 }, { id: 2 }] as Proyecto[];
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
    const p = { id: 1, creadorId: 1 } as Proyecto;
    repo.findOne.mockResolvedValue(p);

    const result = await service.findOne(1, 1);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1, creadorId: 1 },
      relations: ['tareas', 'clienteRel'],
    });
    expect(result).toBe(p);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza proyecto existente', async () => {
    const existente = { id: 1, creadorId: 1, nombre: 'Viejo', estado: 'activo' } as Proyecto;
    const dto: ActualizarProyectoDto = { nombre: 'Nuevo' };
    const guardado = { ...existente, nombre: 'Nuevo' } as Proyecto;

    repo.findOne.mockResolvedValue(existente);
    repo.save.mockResolvedValue(guardado);

    const result = await service.update(1, 1, dto);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1, creadorId: 1 },
      relations: ['tareas', 'clienteRel'],
    });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Nuevo' }));
    expect(result).toBe(guardado);
  });

  it('update: crea transaccion financiera si estado pasa a completado con ganancia', async () => {
    const existente = {
      id: 1, creadorId: 1, nombre: 'Proy', estado: 'activo' as const,
      ganancia: null, clienteId: 2,
    } as Proyecto;
    const dto: ActualizarProyectoDto = { estado: 'completado', ganancia: 5000 };
    const guardado = {
      ...existente, estado: 'completado' as const, ganancia: 5000,
    } as Proyecto;

    repo.findOne.mockResolvedValue(existente);
    repo.save.mockResolvedValue(guardado);

    const result = await service.update(1, 1, dto);

    expect(finanzasService.create).toHaveBeenCalledWith(1, {
      tipo: 'ingreso',
      categoria: 'Desarrollo',
      monto: 5000,
      moneda: 'USD',
      descripcion: 'Ganancia del proyecto: Proy',
      fecha: expect.any(String),
      proyectoId: 1,
      clienteId: 2,
    });
    expect(result).toBe(guardado);
  });

  it('update: no crea transaccion si estado no cambia a completado', async () => {
    const existente = { id: 1, creadorId: 1, estado: 'activo' as const } as Proyecto;
    const dto: ActualizarProyectoDto = { nombre: 'Solo nombre' };
    repo.findOne.mockResolvedValue(existente);
    repo.save.mockResolvedValue({ ...existente, nombre: 'Solo nombre' } as Proyecto);

    await service.update(1, 1, dto);

    expect(finanzasService.create).not.toHaveBeenCalled();
  });

  it('remove: elimina proyecto si existe', async () => {
    const p = { id: 1, creadorId: 1 } as Proyecto;
    repo.findOne.mockResolvedValue(p);
    repo.remove.mockResolvedValue(p);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(p);
  });
});
