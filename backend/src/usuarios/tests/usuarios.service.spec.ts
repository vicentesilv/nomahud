import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from '../dtos/create.usuario.dto';
import { Usuario } from '../entitys/usuarios.entity';
import { UsuariosService } from '../usuarios.service';
import { UpdateUsuarioDto } from '../dtos/update.usuario.dto';

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
            remove: jest.fn(),
            update: jest.fn(),
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
      emailVerificado: false,
      emailVerificadoAt: null,
      estadoCuenta: 'pendiente',
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
      emailVerificado: false,
      emailVerificadoAt: null,
      estadoCuenta: 'pendiente',
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

  it('updateUsuario: actualiza nombre y ciudad y retorna sin contrasena', async () => {
    const usuarioExistente: Usuario = {
      id: 1,
      nombre: 'Nombre Inicial',
      correo: 'usuario@mail.com',
      contrasena: '12345678',
      ciudad: 'Ciudad Inicial',
      fechaNacimiento: new Date('2000-01-01'),
      emailVerificado: false,
      emailVerificadoAt: null,
      estadoCuenta: 'pendiente',
    };

    const dto: UpdateUsuarioDto = {
      nombre: 'Nombre Nuevo',
      ciudad: 'Ciudad Nueva',
    };

    const usuarioGuardado: Usuario = {
      ...usuarioExistente,
      nombre: dto.nombre!,
      ciudad: dto.ciudad!,
    };

    repo.findOne.mockResolvedValue(usuarioExistente);
    repo.save.mockResolvedValue(usuarioGuardado);

    const result = await service.updateUsuario(1, dto);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        nombre: 'Nombre Nuevo',
        ciudad: 'Ciudad Nueva',
      }),
    );
    expect(result).toEqual({
      id: 1,
      nombre: 'Nombre Nuevo',
      correo: 'usuario@mail.com',
      ciudad: 'Ciudad Nueva',
      fechaNacimiento: new Date('2000-01-01'),
      emailVerificado: false,
      emailVerificadoAt: null,
      estadoCuenta: 'pendiente',
    });
    expect((result as any).contrasena).toBeUndefined();
  });

  it('updateUsuario: lanza NotFoundException si usuario no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      service.updateUsuario(999, { nombre: 'Nuevo Nombre' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateUsuario: lanza BadRequestException si intentan cambiar correo o fechaNacimiento', async () => {
    const usuarioExistente: Usuario = {
      id: 1,
      nombre: 'Nombre Inicial',
      correo: 'usuario@mail.com',
      contrasena: '12345678',
      ciudad: 'Ciudad Inicial',
      fechaNacimiento: new Date('2000-01-01'),
      emailVerificado: false,
      emailVerificadoAt: null,
      estadoCuenta: 'pendiente',
    };

    repo.findOne.mockResolvedValue(usuarioExistente);

    await expect(
      service.updateUsuario(1, { correo: 'nuevo@mail.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.updateUsuario(1, { fechaNacimiento: new Date('2001-01-01') }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deleteUsuario: elimina usuario si existe', async () => {
    const usuarioExistente: Usuario = {
      id: 1,
      nombre: 'Nombre',
      correo: 'usuario@mail.com',
      contrasena: '12345678',
      ciudad: 'Ciudad',
      fechaNacimiento: new Date('2000-01-01'),
      emailVerificado: false,
      emailVerificadoAt: null,
      estadoCuenta: 'pendiente',
    };
    
    repo.findOne.mockResolvedValue(usuarioExistente);
    repo.remove.mockResolvedValue(usuarioExistente);

    await service.deleteUsuario(1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repo.remove).toHaveBeenCalledWith(usuarioExistente);
  });

  it('marcarEmailVerificado: actualiza estado y fecha de verificacion', async () => {
    const usuarioExistente: Usuario = {
      id: 1,
      nombre: 'Nombre',
      correo: 'usuario@mail.com',
      contrasena: '12345678',
      ciudad: 'Ciudad',
      fechaNacimiento: new Date('2000-01-01'),
      emailVerificado: false,
      emailVerificadoAt: null,
      estadoCuenta: 'pendiente',
    };

    repo.findOne.mockResolvedValue(usuarioExistente);
    repo.save.mockResolvedValue({
      ...usuarioExistente,
      emailVerificado: true,
      emailVerificadoAt: new Date('2026-04-22T00:00:00.000Z'),
      estadoCuenta: 'activa',
    });

    const result = await service.marcarEmailVerificado(1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        emailVerificado: true,
        estadoCuenta: 'activa',
        emailVerificadoAt: expect.any(Date),
      }),
    );
    expect(result.emailVerificado).toBe(true);
    expect(result.estadoCuenta).toBe('activa');
  });

  it('cambiarContrasena: actualiza contraseña hasheada', async () => {
    repo.update.mockResolvedValue({ affected: 1 } as any);

    await service.cambiarContrasena(1, 'hash-123');

    expect(repo.update).toHaveBeenCalledWith(1, {
      contrasena: 'hash-123',
    });
  });

  it('cambiarContrasena: lanza NotFoundException si no actualiza registros', async () => {
    repo.update.mockResolvedValue({ affected: 0 } as any);

    await expect(service.cambiarContrasena(999, 'hash-123')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

});
