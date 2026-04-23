import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from '../auth.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { MailService } from '../../mail/mail.service';
import { AuthToken } from '../entitys/auth-token.entity';

jest.mock('bcrypt', () => ({
	compare: jest.fn(),
	hash: jest.fn(),
}));

jest.mock('crypto', () => {
	const actualCrypto = jest.requireActual('crypto');

	return {
		...actualCrypto,
		randomBytes: jest.fn(),
	};
});

describe('AuthService', () => {
	let service: AuthService;
	let jwtService: jest.Mocked<JwtService>;
	let usuariosService: jest.Mocked<UsuariosService>;
	let mailService: jest.Mocked<MailService>;
	let authTokenRepository: {
		create: jest.Mock;
		findOne: jest.Mock;
		save: jest.Mock;
	};

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
						findById: jest.fn(),
						marcarEmailVerificado: jest.fn(),
						cambiarContrasena: jest.fn(),
						createUsuario: jest.fn(),
					},
				},
				{
					provide: MailService,
					useValue: {
						sendMail: jest.fn(),
					},
				},
				{
					provide: getRepositoryToken(AuthToken),
					useValue: {
						create: jest.fn(),
						findOne: jest.fn(),
						save: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		jwtService = module.get(JwtService);
		usuariosService = module.get(UsuariosService);
		mailService = module.get(MailService);
		authTokenRepository = module.get(getRepositoryToken(AuthToken));
	});

	afterEach(() => {
		jest.clearAllMocks();
		delete process.env.JWT_SECRET;
		delete process.env.JWT_EXPIRES_IN;
		delete process.env.FRONTEND_URL;
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
			emailVerificado: true,
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
				emailVerificado: true,
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
			emailVerificado: true,
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		} as any);
		(bcrypt.compare as jest.Mock).mockResolvedValue(false);

		await expect(service.login('vicente@mail.com', 'bad-password')).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});

	it('login: bloquea acceso si el email no está verificado', async () => {
		usuariosService.findByEmail.mockResolvedValue({
			id: 1,
			correo: 'vicente@mail.com',
			nombre: 'Vicente',
			contrasena: 'hashed-password',
			emailVerificado: false,
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		} as any);
		(bcrypt.compare as jest.Mock).mockResolvedValue(true);

		await expect(service.login('vicente@mail.com', '12345678')).rejects.toThrow(
			'Debes confirmar tu cuenta antes de iniciar sesión',
		);
		expect(jwtService.sign).not.toHaveBeenCalled();
	});

	it('register: crea usuario con contrasena hasheada', async () => {
		const fechaNacimiento = new Date('2000-01-01');
		(crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('token-confirmacion'));
		const confirmationToken = Buffer.from('token-confirmacion').toString('hex');
		const expectedTokenHash = crypto.createHash('sha256').update(confirmationToken).digest('hex');

		usuariosService.findByEmail.mockResolvedValue(null);
		(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
		usuariosService.createUsuario.mockResolvedValue({
			id: 20,
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			ciudad: 'Santiago',
			fechaNacimiento,
		} as any);
		authTokenRepository.create.mockReturnValue({ id: 1 } as AuthToken);
		authTokenRepository.save.mockResolvedValue({ id: 1 } as AuthToken);
		(mailService.sendMail as jest.Mock).mockResolvedValue(undefined);
		process.env.FRONTEND_URL = 'http://frontend.test';

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
		expect(authTokenRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				usuarioId: 20,
				tipo: 'confirmacion_email',
				tokenHash: expectedTokenHash,
				expiraEn: expect.any(Date),
			}),
		);
		expect(authTokenRepository.save).toHaveBeenCalled();
		expect(mailService.sendMail).toHaveBeenCalledWith(
			'vicente@mail.com',
			'Confirma tu cuenta',
			expect.stringContaining('Confirma tu cuenta'),
			expect.objectContaining({
				nombre: 'Vicente',
				enlaceConfirmacion: `http://frontend.test/confirmar-cuenta?token=${confirmationToken}`,
			}),
		);
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

	it('confirmarCuenta: marca email como verificado y usa token', async () => {
		const token = 'confirmacion-token';
		const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
		const authToken = {
			id: 1,
			usuarioId: 20,
			tipo: 'confirmacion_email',
			tokenHash,
			expiraEn: new Date(Date.now() + 60 * 60 * 1000),
			usadoEn: null,
		} as any;

		authTokenRepository.findOne.mockResolvedValue(authToken);
		(usuariosService.marcarEmailVerificado as jest.Mock).mockResolvedValue({
			id: 20,
			emailVerificado: true,
		} as any);
		authTokenRepository.save.mockResolvedValue({ ...authToken, usadoEn: new Date() } as any);

		const result = await service.confirmarCuenta(token);

		expect(authTokenRepository.findOne).toHaveBeenCalledWith({
			where: {
				tokenHash,
				tipo: 'confirmacion_email',
			},
		});
		expect(usuariosService.marcarEmailVerificado).toHaveBeenCalledWith(20);
		expect(authTokenRepository.save).toHaveBeenCalledWith(
			expect.objectContaining({
				usadoEn: expect.any(Date),
			}),
		);
		expect(result).toEqual({ mensaje: 'Cuenta confirmada correctamente' });
	});

	it('confirmarCuenta: lanza BadRequestException si el token no existe', async () => {
		authTokenRepository.findOne.mockResolvedValue(null);

		await expect(service.confirmarCuenta('token-invalido')).rejects.toBeInstanceOf(
			BadRequestException,
		);
	});

	it('reenviarConfirmacion: reenvía correo cuando cumple la frecuencia', async () => {
		const usuario = {
			id: 20,
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			emailVerificado: false,
		} as any;

		(crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('token-reenvio'));
		usuariosService.findByEmail.mockResolvedValue(usuario);
		authTokenRepository.findOne.mockResolvedValue({
			id: 1,
			usuarioId: 20,
			tipo: 'confirmacion_email',
			creadoEn: new Date(Date.now() - 61 * 1000),
		} as any);
		authTokenRepository.create.mockReturnValue({ id: 2 } as any);
		authTokenRepository.save.mockResolvedValue({ id: 2 } as any);
		(mailService.sendMail as jest.Mock).mockResolvedValue(undefined);

		const result = await service.reenviarConfirmacion('vicente@mail.com');

		expect(usuariosService.findByEmail).toHaveBeenCalledWith('vicente@mail.com');
		expect(authTokenRepository.findOne).toHaveBeenCalledWith({
			where: {
				usuarioId: 20,
				tipo: 'confirmacion_email',
			},
			order: {
				creadoEn: 'DESC',
			},
		});
		expect(authTokenRepository.create).toHaveBeenCalled();
		expect(authTokenRepository.save).toHaveBeenCalled();
		expect(mailService.sendMail).toHaveBeenCalled();
		expect(result).toEqual({ mensaje: 'Correo de confirmación reenviado correctamente' });
	});

	it('reenviarConfirmacion: bloquea si se solicita antes de 60 segundos', async () => {
		usuariosService.findByEmail.mockResolvedValue({
			id: 20,
			correo: 'vicente@mail.com',
			nombre: 'Vicente',
			emailVerificado: false,
		} as any);
		authTokenRepository.findOne.mockResolvedValue({
			id: 1,
			usuarioId: 20,
			tipo: 'confirmacion_email',
			creadoEn: new Date(Date.now() - 30 * 1000),
		} as any);

		await expect(service.reenviarConfirmacion('vicente@mail.com')).rejects.toThrow(
			'Debes esperar 60 segundos antes de reenviar la confirmación',
		);
		expect(mailService.sendMail).not.toHaveBeenCalled();
	});

	it('solicitarRecuperacion: responde mensaje genérico si usuario no existe', async () => {
		usuariosService.findByEmail.mockResolvedValue(null);

		const result = await service.solicitarRecuperacion('noexiste@mail.com');

		expect(result).toEqual({ mensaje: 'Si el correo existe, se enviaron instrucciones' });
		expect(authTokenRepository.create).not.toHaveBeenCalled();
		expect(mailService.sendMail).not.toHaveBeenCalled();
	});

	it('solicitarRecuperacion: genera token y envía correo si usuario existe', async () => {
		const usuario = {
			id: 99,
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
		} as any;

		(crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('token-recuperacion'));
		const recoveryToken = Buffer.from('token-recuperacion').toString('hex');
		const expectedTokenHash = crypto.createHash('sha256').update(recoveryToken).digest('hex');

		usuariosService.findByEmail.mockResolvedValue(usuario);
		authTokenRepository.create.mockReturnValue({ id: 15 } as any);
		authTokenRepository.save.mockResolvedValue({ id: 15 } as any);
		(mailService.sendMail as jest.Mock).mockResolvedValue(undefined);
		process.env.FRONTEND_URL = 'http://frontend.test';

		const result = await service.solicitarRecuperacion('vicente@mail.com');

		expect(authTokenRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				usuarioId: 99,
				tipo: 'recuperacion_password',
				tokenHash: expectedTokenHash,
				expiraEn: expect.any(Date),
			}),
		);
		expect(authTokenRepository.save).toHaveBeenCalled();
		expect(mailService.sendMail).toHaveBeenCalledWith(
			'vicente@mail.com',
			'Recuperación de contraseña',
			expect.stringContaining('Recuperación de contraseña'),
			expect.objectContaining({
				nombre: 'Vicente',
				enlaceRecuperacion: `http://frontend.test/restablecer-contrasena?token=${recoveryToken}`,
			}),
		);
		expect(result).toEqual({ mensaje: 'Si el correo existe, se enviaron instrucciones' });
	});

	it('restablecerContrasena: actualiza contraseña e invalida token', async () => {
		const token = 'token-recuperacion';
		const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
		const authToken = {
			id: 50,
			usuarioId: 99,
			tipo: 'recuperacion_password',
			tokenHash,
			expiraEn: new Date(Date.now() + 60 * 60 * 1000),
			usadoEn: null,
		} as any;

		authTokenRepository.findOne.mockResolvedValue(authToken);
		(bcrypt.hash as jest.Mock).mockResolvedValue('nueva-contrasena-hash');
		(usuariosService.cambiarContrasena as jest.Mock).mockResolvedValue(undefined);
		authTokenRepository.save.mockResolvedValue({ ...authToken, usadoEn: new Date() } as any);

		const result = await service.restablecerContrasena(token, 'Nueva1234');

		expect(authTokenRepository.findOne).toHaveBeenCalledWith({
			where: {
				tokenHash,
				tipo: 'recuperacion_password',
			},
		});
		expect(bcrypt.hash).toHaveBeenCalledWith('Nueva1234', 10);
		expect(usuariosService.cambiarContrasena).toHaveBeenCalledWith(99, 'nueva-contrasena-hash');
		expect(authTokenRepository.save).toHaveBeenCalledWith(
			expect.objectContaining({
				usadoEn: expect.any(Date),
			}),
		);
		expect(result).toEqual({ mensaje: 'Contraseña restablecida correctamente' });
	});

	it('restablecerContrasena: lanza error si token no existe', async () => {
		authTokenRepository.findOne.mockResolvedValue(null);

		await expect(service.restablecerContrasena('token-invalido', 'Nueva1234')).rejects.toBeInstanceOf(
			BadRequestException,
		);
		expect(usuariosService.cambiarContrasena).not.toHaveBeenCalled();
	});
});
