import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PerfilesService } from '../perfiles.service';
import { Perfil } from '../entities/perfil.entity';

describe('PerfilesService', () => {
  let service: PerfilesService;
  let repo: jest.Mocked<{
    create: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerfilesService,
        {
          provide: getRepositoryToken(Perfil),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PerfilesService);
    repo = module.get(getRepositoryToken(Perfil));
  });

  it('findOrCreate retorna perfil existente', async () => {
    const perfil = { id: 1, usuarioId: 10 } as Perfil;
    repo.findOne.mockResolvedValue(perfil);

    const result = await service.findOrCreate(10);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { usuarioId: 10 } });
    expect(result).toBe(perfil);
  });

  it('findOrCreate crea perfil si no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ usuarioId: 10 } as Perfil);
    repo.save.mockResolvedValue({ id: 1, usuarioId: 10 } as Perfil);

    const result = await service.findOrCreate(10);

    expect(repo.create).toHaveBeenCalledWith({ usuarioId: 10 });
    expect(repo.save).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, usuarioId: 10 });
  });

  it('findByUsuarioId retorna perfil si existe', async () => {
    const perfil = { id: 1, usuarioId: 10 } as Perfil;
    repo.findOne.mockResolvedValue(perfil);

    const result = await service.findByUsuarioId(10);

    expect(result).toBe(perfil);
  });

  it('findByUsuarioId lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findByUsuarioId(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update actualiza y guarda perfil', async () => {
    const perfil = { id: 1, usuarioId: 10, bio: 'vieja', sitioWeb: null } as Perfil;
    repo.findOne.mockResolvedValue(perfil);
    repo.save.mockResolvedValue({ ...perfil, bio: 'nueva' } as Perfil);

    const result = await service.update(10, { bio: 'nueva' });

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ bio: 'nueva' }));
    expect(result.bio).toBe('nueva');
  });
});
