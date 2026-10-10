import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

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
						confirmarCuenta: jest.fn(),
						reenviarConfirmacion: jest.fn(),
						solicitarRecuperacion: jest.fn(),
						restablecerContrasena: jest.fn(),
						renovar: jest.fn(),
						cerrarSesion: jest.fn(),
						completarRegistro: jest.fn(),
					},
				},
			],
		})
			.overrideGuard(ThrottlerGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get(AuthController);
		authService = module.get(AuthService);
	});

	it('debe estar definido', () => {
		expect(controller).toBeDefined();
	});

	it('login: delega en AuthService', async () => {
		authService.login.mockResolvedValue({ token: 'jwt', usuario: { id: 1 } } as any);

		const result = await controller.login({ correo: 'test@mail.com', contrasena: '12345678' });

		expect(authService.login).toHaveBeenCalledWith('test@mail.com', '12345678');
		expect(result).toEqual({ token: 'jwt', usuario: { id: 1 } });
	});

	it('register: delega en AuthService', async () => {
		authService.register.mockResolvedValue({ usuario: { id: 2 } } as any);

		const result = await controller.register({
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			contrasena: '12345678',
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		});

		expect(authService.register).toHaveBeenCalledWith(
			'Vicente',
			'vicente@mail.com',
			'12345678',
			'Santiago',
			new Date('2000-01-01'),
			undefined,
		);
		expect(result).toEqual({ usuario: { id: 2 } });
	});

	it('confirmarCuenta: delega en AuthService', async () => {
		authService.confirmarCuenta.mockResolvedValue({ mensaje: 'Cuenta confirmada correctamente' });

		const result = await controller.confirmarCuenta({ token: 'token-123' });

		expect(authService.confirmarCuenta).toHaveBeenCalledWith('token-123');
		expect(result).toEqual({ mensaje: 'Cuenta confirmada correctamente' });
	});

	it('reenviarConfirmacion: delega en AuthService', async () => {
		authService.reenviarConfirmacion.mockResolvedValue({
			mensaje: 'Correo de confirmación reenviado correctamente',
		});

		const result = await controller.reenviarConfirmacion({ correo: 'vicente@mail.com' });

		expect(authService.reenviarConfirmacion).toHaveBeenCalledWith('vicente@mail.com');
		expect(result).toEqual({ mensaje: 'Correo de confirmación reenviado correctamente' });
	});

	it('solicitarRecuperacion: delega en AuthService', async () => {
		authService.solicitarRecuperacion.mockResolvedValue({
			mensaje: 'Si el correo existe, se enviaron instrucciones',
		});

		const result = await controller.solicitarRecuperacion({ correo: 'vicente@mail.com' });

		expect(authService.solicitarRecuperacion).toHaveBeenCalledWith('vicente@mail.com');
		expect(result).toEqual({ mensaje: 'Si el correo existe, se enviaron instrucciones' });
	});

	it('restablecerContrasena: delega en AuthService', async () => {
		authService.restablecerContrasena.mockResolvedValue({
			mensaje: 'Contraseña restablecida correctamente',
		});

		const result = await controller.restablecerContrasena({
			token: 'token-123',
			nuevaContrasena: 'Nueva1234',
		});

		expect(authService.restablecerContrasena).toHaveBeenCalledWith('token-123', 'Nueva1234');
		expect(result).toEqual({ mensaje: 'Contraseña restablecida correctamente' });
	});

	it('renovar: delega en AuthService', async () => {
		authService.renovar.mockResolvedValue({ token: 'jwt', refreshToken: 'rt', usuario: { id: 1 } } as any);

		const result = await controller.renovar({ refreshToken: 'rt-viejo' });

		expect(authService.renovar).toHaveBeenCalledWith('rt-viejo');
		expect(result).toEqual({ token: 'jwt', refreshToken: 'rt', usuario: { id: 1 } });
	});

	it('cerrarSesion: delega en AuthService con id de usuario', async () => {
		authService.cerrarSesion.mockResolvedValue({ mensaje: 'Sesión cerrada correctamente' });

		const result = await controller.cerrarSesion({ id: 1 } as any, { refreshToken: 'rt' });

		expect(authService.cerrarSesion).toHaveBeenCalledWith('rt', 1);
		expect(result).toEqual({ mensaje: 'Sesión cerrada correctamente' });
	});

	it('completarRegistro: delega en AuthService con id de usuario', async () => {
		authService.completarRegistro.mockResolvedValue({ usuario: { id: 1, rol: 'normal' } } as any);

		const result = await controller.completarRegistro({ id: 1 } as any);

		expect(authService.completarRegistro).toHaveBeenCalledWith(1);
		expect(result).toEqual({ usuario: { id: 1, rol: 'normal' } });
	});
});
