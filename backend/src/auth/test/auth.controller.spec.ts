import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dtos/login.dto';
import { CreateUsuarioDto } from '../../usuarios/dtos/create.usuario.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('POST /auth/inicio-sesion no debe estar protegido con JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype.login);
    expect(guards).toBeUndefined();
  });

  it('POST /auth/registro no debe estar protegido con JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype.register);
    expect(guards).toBeUndefined();
  });

  it('login: llama a authService.login y retorna token con usuario', async () => {
    const loginDto: LoginDto = {
      correo: 'vicente@mail.com',
      contrasena: '12345678',
    };

    authService.login.mockResolvedValue({
      token: 'jwt-token',
      usuario: {
        id: 1,
        nombre: 'Vicente',
        correo: 'vicente@mail.com',
      },
    });

    const result = await controller.login(loginDto);

    expect(authService.login).toHaveBeenCalledWith('vicente@mail.com', '12345678');
    expect(result).toEqual({
      token: 'jwt-token',
      usuario: {
        id: 1,
        nombre: 'Vicente',
        correo: 'vicente@mail.com',
      },
    });
  });

  it('login: propaga UnauthorizedException', async () => {
    const loginDto: LoginDto = {
      correo: 'vicente@mail.com',
      contrasena: 'bad-password',
    };

    authService.login.mockRejectedValue(new UnauthorizedException('Credenciales inválidas'));

    await expect(controller.login(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('register: llama a authService.register y retorna usuario', async () => {
    const fechaNacimiento = new Date('2000-01-01');
    const registerDto: CreateUsuarioDto = {
      nombre: 'Vicente',
      correo: 'vicente@mail.com',
      contrasena: '12345678',
      ciudad: 'Santiago',
      fechaNacimiento,
    };

    authService.register.mockResolvedValue({
      usuario: {
        id: 2,
        nombre: 'Vicente',
        correo: 'vicente@mail.com',
        ciudad: 'Santiago',
        fechaNacimiento,
      },
    });

    const result = await controller.register(registerDto);

    expect(authService.register).toHaveBeenCalledWith(
      'Vicente',
      'vicente@mail.com',
      '12345678',
      'Santiago',
      fechaNacimiento,
    );
    expect(result).toEqual({
      usuario: {
        id: 2,
        nombre: 'Vicente',
        correo: 'vicente@mail.com',
        ciudad: 'Santiago',
        fechaNacimiento,
      },
    });
  });

  it('register: propaga BadRequestException cuando usuario ya existe', async () => {
    const registerDto: CreateUsuarioDto = {
      nombre: 'Vicente',
      correo: 'vicente@mail.com',
      contrasena: '12345678',
    };

    authService.register.mockRejectedValue(new BadRequestException('El usuario ya existe'));

    await expect(controller.register(registerDto)).rejects.toBeInstanceOf(BadRequestException);
  });
});