import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UsuariosService } from '../../usuarios/usuarios.service';

jest.mock('bcrypt', () => ({
	compare: jest.fn(),
	hash: jest.fn(),
}));

describe('AuthService', () => {
	let service: AuthService;
	let jwtService: jest.Mocked<JwtService>;
	let usuariosService: jest.Mocked<UsuariosService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: JwtService,
					useValue: {
						sign: jest.fn(),
					},
				},
				{
					provide: UsuariosService,
					useValue: {
						findByEmail: jest.fn(),
						createUsuario: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		jwtService = module.get(JwtService);
		usuariosService = module.get(UsuariosService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		delete process.env.JWT_SECRET;
		delete process.env.JWT_EXPIRES_IN;
	});

	it('debe estar definido', () => {
		expect(service).toBeDefined();
	});

	it('validatePassword: usa bcrypt.compare', async () => {
		const compareMock = bcrypt.compare as jest.Mock;
		compareMock.mockResolvedValue(true);

		const result = await (service as any).validatePassword('12345678', 'hashed-password');

		expect(compareMock).toHaveBeenCalledWith('12345678', 'hashed-password');
		expect(result).toBe(true);
	});

	it('generateToken: firma JWT con secret y expires del env', () => {
		process.env.JWT_SECRET = 'super-secret';
		process.env.JWT_EXPIRES_IN = '48h';
		jwtService.sign.mockReturnValue('jwt-token');

		const token = (service as any).generateToken(1, 'vicente@mail.com');

		expect(jwtService.sign).toHaveBeenCalledWith(
			{ userId: 1, correo: 'vicente@mail.com' },
			{ secret: 'super-secret', expiresIn: '48h' },
		);
		expect(token).toBe('jwt-token');
	});

	it('generateToken: usa 24h por defecto si no hay JWT_EXPIRES_IN', () => {
		process.env.JWT_SECRET = 'super-secret';
		jwtService.sign.mockReturnValue('jwt-token');

		(service as any).generateToken(1, 'vicente@mail.com');

		expect(jwtService.sign).toHaveBeenCalledWith(
			{ userId: 1, correo: 'vicente@mail.com' },
			{ secret: 'super-secret', expiresIn: '24h' },
		);
	});

	it('login: retorna token y usuario sin contrasena', async () => {
		const usuario = {
			id: 10,
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			contrasena: 'hashed-password',
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		} as any;

		usuariosService.findByEmail.mockResolvedValue(usuario);
		(bcrypt.compare as jest.Mock).mockResolvedValue(true);
		jwtService.sign.mockReturnValue('jwt-token');

		const result = await service.login('vicente@mail.com', '12345678');

		expect(usuariosService.findByEmail).toHaveBeenCalledWith('vicente@mail.com');
		expect(bcrypt.compare).toHaveBeenCalledWith('12345678', 'hashed-password');
		expect(jwtService.sign).toHaveBeenCalled();
		expect(result).toEqual({
			token: 'jwt-token',
			usuario: {
				id: 10,
				nombre: 'Vicente',
				correo: 'vicente@mail.com',
				ciudad: 'Santiago',
				fechaNacimiento: new Date('2000-01-01'),
			},
		});
		expect((result.usuario as any).contrasena).toBeUndefined();
	});

	it('login: lanza UnauthorizedException si usuario no existe', async () => {
		usuariosService.findByEmail.mockResolvedValue(null);

		await expect(service.login('noexiste@mail.com', '12345678')).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});

	it('login: lanza UnauthorizedException si usuario no trae contrasena', async () => {
		usuariosService.findByEmail.mockResolvedValue({
			id: 1,
			correo: 'vicente@mail.com',
			nombre: 'Vicente',
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		} as any);

		await expect(service.login('vicente@mail.com', '12345678')).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});

	it('login: lanza UnauthorizedException si contrasena es incorrecta', async () => {
		usuariosService.findByEmail.mockResolvedValue({
			id: 1,
			correo: 'vicente@mail.com',
			nombre: 'Vicente',
			contrasena: 'hashed-password',
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		} as any);
		(bcrypt.compare as jest.Mock).mockResolvedValue(false);

		await expect(service.login('vicente@mail.com', 'bad-password')).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});

	it('register: crea usuario con contrasena hasheada', async () => {
		const fechaNacimiento = new Date('2000-01-01');

		usuariosService.findByEmail.mockResolvedValue(null);
		(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
		usuariosService.createUsuario.mockResolvedValue({
			id: 20,
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			ciudad: 'Santiago',
			fechaNacimiento,
		} as any);

		const result = await service.register(
			'Vicente',
			'vicente@mail.com',
			'12345678',
			'Santiago',
			fechaNacimiento,
		);

		expect(usuariosService.findByEmail).toHaveBeenCalledWith('vicente@mail.com');
		expect(bcrypt.hash).toHaveBeenCalledWith('12345678', 10);
		expect(usuariosService.createUsuario).toHaveBeenCalledWith({
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			contrasena: 'hashed-password',
			ciudad: 'Santiago',
			fechaNacimiento,
		});
		expect(result).toEqual({
			usuario: {
				id: 20,
				nombre: 'Vicente',
				correo: 'vicente@mail.com',
				ciudad: 'Santiago',
				fechaNacimiento,
			},
		});
	});

	it('register: lanza BadRequestException si usuario ya existe', async () => {
		usuariosService.findByEmail.mockResolvedValue({ id: 1 } as any);

		await expect(
			service.register('Vicente', 'vicente@mail.com', '12345678'),
		).rejects.toBeInstanceOf(BadRequestException);

		expect(bcrypt.hash).not.toHaveBeenCalled();
		expect(usuariosService.createUsuario).not.toHaveBeenCalled();
	});
});
