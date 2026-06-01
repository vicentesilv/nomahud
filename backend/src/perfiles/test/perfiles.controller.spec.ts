import { Test, TestingModule } from '@nestjs/testing';
import { PerfilesController } from '../perfiles.controller';
import { PerfilesService } from '../perfiles.service';

describe('PerfilesController', () => {
  let controller: PerfilesController;
  let service: jest.Mocked<PerfilesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerfilesController],
      providers: [
        {
          provide: PerfilesService,
          useValue: {
            findOrCreate: jest.fn(),
            update: jest.fn(),
            findByUsuarioId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PerfilesController);
    service = module.get(PerfilesService);
  });

  it('getMiPerfil delega en service', async () => {
    const usuario = { id: 1 } as any;
    service.findOrCreate.mockResolvedValue({ id: 1 } as any);

    const result = await controller.getMiPerfil(usuario);

    expect(service.findOrCreate).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1 });
  });

  it('updateMiPerfil delega en service', async () => {
    const usuario = { id: 1 } as any;
    const dto = { bio: 'nueva bio' };
    service.update.mockResolvedValue({ id: 1, bio: 'nueva bio' } as any);

    const result = await controller.updateMiPerfil(usuario, dto as any);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result.bio).toBe('nueva bio');
  });

  it('getPerfilPublico delega en service', async () => {
    service.findByUsuarioId.mockResolvedValue({ id: 1, usuarioId: 5 } as any);

    const result = await controller.getPerfilPublico(5);

    expect(service.findByUsuarioId).toHaveBeenCalledWith(5);
    expect(result.usuarioId).toBe(5);
  });
});
