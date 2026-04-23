import { Test, TestingModule } from '@nestjs/testing';
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
					},
				},
			],
		}).compile();

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
		);
		expect(result).toEqual({ usuario: { id: 2 } });
	});

	it('confirmarCuenta: delega en AuthService', async () => {
		authService.confirmarCuenta.mockResolvedValue({ mensaje: 'Cuenta confirmada correctamente' });

		const result = await controller.confirmarCuenta({ token: 'token-123' });

		expect(authService.confirmarCuenta).toHaveBeenCalledWith('token-123');
		expect(result).toEqual({ mensaje: 'Cuenta confirmada correctamente' });
	});
});