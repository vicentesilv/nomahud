import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UsuariosController } from '../usuarios.controller';
import { UsuariosService } from '../usuarios.service';
import { Usuario } from '../entitys/usuarios.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('UsuariosController', () => {
	let controller: UsuariosController;
	let usuariosService: jest.Mocked<UsuariosService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsuariosController],
			providers: [
				{
					provide: UsuariosService,
				useValue: {
					createUsuario: jest.fn(),
					findById: jest.fn(),
					updateUsuario: jest.fn(),
					deleteUsuario: jest.fn(),
				},
				},
			],
		}).compile();

		controller = module.get<UsuariosController>(UsuariosController);
		usuariosService = module.get(UsuariosService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('debe estar definido', () => {
		expect(controller).toBeDefined();
	});

	it('controlador debe estar protegido con JwtAuthGuard', () => {
		const guards = Reflect.getMetadata(GUARDS_METADATA, UsuariosController);

		expect(guards).toBeDefined();
		expect(guards[0]).toBe(JwtAuthGuard);
	});

	it('GET /usuarios/:id: retorna usuario si es el propietario', async () => {
		const usuario = {
			id: 1,
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		} as Usuario;

		usuariosService.findById.mockResolvedValue(usuario);

		const result = await controller.getUser(1, 1);

		expect(result).toBe(usuario);
	});
	it('GET /usuarios/:id: lanza Forbidden si no es el propietario', async () => {
		await expect(controller.getUser(1, 2)).rejects.toThrow('No tienes permiso');
		expect(usuariosService.findById).not.toHaveBeenCalled();
	});
	it('GET /usuarios/:id: lanza error si usuario no existe', async () => {
		usuariosService.findById.mockResolvedValue(null);

		await expect(controller.getUser(999, 999)).rejects.toThrow('Usuario no existe');
	});
	it('PATCH /usuarios/:id: llama a updateUsuario del service', async () => {
		const updateDto = {
			ciudad: 'Valparaiso',
		};

		const usuarioActualizado = {
			id: 1,
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			ciudad: updateDto.ciudad,
			fechaNacimiento: new Date('2000-01-01'),
		} as Usuario;

		usuariosService.updateUsuario.mockResolvedValue(usuarioActualizado);

		const result = await controller.updateUser(1, 1, updateDto);

		expect(usuariosService.updateUsuario).toHaveBeenCalledWith(1, updateDto);
		expect(result).toBe(usuarioActualizado);
	});
	it('PATCH /usuarios/:id: lanza error si se intenta actualizar correo o fechaNacimiento', async () => {
		const updateDto = {
			correo: 'nuevo@mail.com',
			fechaNacimiento: new Date('1990-01-01'),
		} as any;

		usuariosService.updateUsuario.mockRejectedValue(
			new Error('No se permite actualizar correo ni fechaNacimiento'),
		);

		await expect(controller.updateUser(1, 1, updateDto)).rejects.toThrow('No se permite actualizar correo ni fechaNacimiento');
		expect(usuariosService.updateUsuario).toHaveBeenCalledWith(1, updateDto);
	});
	it('PATCH /usuarios/:id: error si usuario no existe', async () => {
		const updateDto = {
			ciudad: 'Valparaiso',
		};

		usuariosService.updateUsuario.mockRejectedValue(new Error('Usuario no encontrado'));

		await expect(controller.updateUser(999, 999, updateDto)).rejects.toThrow('Usuario no encontrado');
	});
});
