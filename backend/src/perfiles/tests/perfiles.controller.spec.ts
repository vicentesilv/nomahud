import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PerfilesController } from '../perfiles.controller';
import { PerfilesService } from '../perfiles.service';
import { ActualizarPerfilDto } from '../dtos/actualizar-perfil.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('PerfilesController', () => {
  let controller: PerfilesController;
  let perfilesService: jest.Mocked<PerfilesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerfilesController],
      providers: [
        {
          provide: PerfilesService,
          useValue: {
            findOrCreate: jest.fn(),
            findByUsuarioId: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PerfilesController>(PerfilesController);
    perfilesService = module.get(PerfilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('GET /perfiles/mi-perfil: usa JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PerfilesController.prototype.getMiPerfil,
    );
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('PATCH /perfiles/mi-perfil: usa JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PerfilesController.prototype.updateMiPerfil,
    );
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('GET /perfiles/:id: usa JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PerfilesController.prototype.getPerfilPublico,
    );
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('getMiPerfil: llama a findOrCreate con usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const perfilEsperado = { id: 1, usuarioId: 1 } as any;
    perfilesService.findOrCreate.mockResolvedValue(perfilEsperado);

    const result = await controller.getMiPerfil(usuario);

    expect(perfilesService.findOrCreate).toHaveBeenCalledWith(1);
    expect(result).toBe(perfilEsperado);
  });

  it('updateMiPerfil: llama a update con usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: ActualizarPerfilDto = { bio: 'nueva bio' };
    const perfilActualizado = { id: 1, bio: 'nueva bio' } as any;
    perfilesService.update.mockResolvedValue(perfilActualizado);

    const result = await controller.updateMiPerfil(usuario, dto);

    expect(perfilesService.update).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(perfilActualizado);
  });

  it('getPerfilPublico: llama a findByUsuarioId con id del param', async () => {
    const perfil = { id: 5, usuarioId: 5 } as any;
    perfilesService.findByUsuarioId.mockResolvedValue(perfil);

    const result = await controller.getPerfilPublico(5);

    expect(perfilesService.findByUsuarioId).toHaveBeenCalledWith(5);
    expect(result).toBe(perfil);
  });
});
