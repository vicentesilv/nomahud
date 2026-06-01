import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PerfilesService } from '../perfiles.service';
import { Perfil } from '../entities/perfil.entity';
import { ActualizarPerfilDto } from '../dtos/actualizar-perfil.dto';

describe('PerfilesService', () => {
  let service: PerfilesService;
  let repo: jest.Mocked<Repository<Perfil>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerfilesService,
        {
          provide: getRepositoryToken(Perfil),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PerfilesService>(PerfilesService);
    repo = module.get(getRepositoryToken(Perfil));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findOrCreate: retorna perfil existente si ya existe', async () => {
    const perfilExistente = { id: 1, usuarioId: 1 } as Perfil;
    repo.findOne.mockResolvedValue(perfilExistente);

    const result = await service.findOrCreate(1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { usuarioId: 1 } });
    expect(result).toBe(perfilExistente);
  });

  it('findOrCreate: crea nuevo perfil si no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    const perfilCreado = { id: 1, usuarioId: 1 } as Perfil;
    repo.create.mockReturnValue(perfilCreado);
    repo.save.mockResolvedValue(perfilCreado);

    const result = await service.findOrCreate(1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { usuarioId: 1 } });
    expect(repo.create).toHaveBeenCalledWith({ usuarioId: 1 });
    expect(repo.save).toHaveBeenCalledWith(perfilCreado);
    expect(result).toBe(perfilCreado);
  });

  it('findByUsuarioId: retorna perfil si existe', async () => {
    const perfil = { id: 1, usuarioId: 1 } as Perfil;
    repo.findOne.mockResolvedValue(perfil);

    const result = await service.findByUsuarioId(1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { usuarioId: 1 } });
    expect(result).toBe(perfil);
  });

  it('findByUsuarioId: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findByUsuarioId(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza perfil existente', async () => {
    const perfilExistente = { id: 1, usuarioId: 1, bio: 'vieja bio' } as Perfil;
    const dto: ActualizarPerfilDto = { bio: 'nueva bio' };
    const perfilGuardado = { ...perfilExistente, bio: 'nueva bio' } as Perfil;

    repo.findOne.mockResolvedValue(perfilExistente);
    repo.save.mockResolvedValue(perfilGuardado);

    const result = await service.update(1, dto);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { usuarioId: 1 } });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ bio: 'nueva bio' }),
    );
    expect(result).toBe(perfilGuardado);
  });
});
