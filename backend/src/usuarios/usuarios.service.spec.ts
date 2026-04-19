import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from './dtos/create.usuario.dto';
import { Usuario } from './usuarios.entity';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repo: jest.Mocked<Repository<Usuario>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    repo = module.get(getRepositoryToken(Usuario));
  });

  it('createUsuario: crea y retorna usuario sin contrasena', async () => {
    const dto: CreateUsuarioDto = {
      nombre: 'Vicente',
      correo: 'vicente@mail.com',
      contrasena: '12345678',
      ciudad: 'Santiago',
    };

    const usuarioCreado: Usuario = {
      id: 1,
      nombre: dto.nombre,
      correo: dto.correo,
      contrasena: dto.contrasena,
      ciudad: dto.ciudad ?? '',
      fechaNacimiento: new Date('2000-01-01'),
    };

    repo.create.mockReturnValue(usuarioCreado);
    repo.save.mockResolvedValue(usuarioCreado);

    const result = await service.createUsuario(dto);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(usuarioCreado);
    expect(result).toEqual({
      id: 1,
      nombre: 'Vicente',
      correo: 'vicente@mail.com',
      ciudad: 'Santiago',
      fechaNacimiento: new Date('2000-01-01'),
    });
    expect((result as any).contrasena).toBeUndefined();
  });

  it('findByEmail: retorna usuario si existe', async () => {
    const usuario = { id: 1, correo: 'vicente@mail.com' } as Usuario;
    repo.findOne.mockResolvedValue(usuario);

    const result = await service.findByEmail('vicente@mail.com');

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { correo: 'vicente@mail.com' },
    });
    expect(result).toBe(usuario);
  });

  it('findByEmail: retorna null si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    const result = await service.findByEmail('noexiste@mail.com');

    expect(result).toBeNull();
  });

  it('findById: retorna usuario si existe', async () => {
    const usuario = { id: 1 } as Usuario;
    repo.findOne.mockResolvedValue(usuario);

    const result = await service.findById(1);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(result).toBe(usuario);
  });

  it('findById: retorna null si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    const result = await service.findById(999);

    expect(result).toBeNull();
  });
});
