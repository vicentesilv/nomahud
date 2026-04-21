import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import * as bcrypt from 'bcrypt';
import { UsuariosController } from '../usuarios.controller';
import { UsuariosService } from '../usuarios.service';
import { CreateUsuarioDto } from '../dtos/create.usuario.dto';
import { Usuario } from '../entitys/usuarios.entity';

jest.mock('bcrypt', () => ({
	hash: jest.fn(),
}));

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

	it('createUser: hashea contrasena y llama a createUsuario del service', async () => {
		const dto: CreateUsuarioDto = {
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			contrasena: '12345678',
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		};

		const hashMock = bcrypt.hash as jest.Mock;
		hashMock.mockResolvedValue('contrasena_hasheada');

		const usuarioCreado = {
			id: 1,
			nombre: dto.nombre,
			correo: dto.correo,
			ciudad: dto.ciudad,
			fechaNacimiento: dto.fechaNacimiento,
		} as Usuario;

		usuariosService.createUsuario.mockResolvedValue(usuarioCreado);

		const result = await controller.createUser(dto);

		expect(hashMock).toHaveBeenCalledWith('12345678', 10);
		expect(usuariosService.createUsuario).toHaveBeenCalledWith({
			...dto,
			contrasena: 'contrasena_hasheada',
		});
		expect(result).toBe(usuarioCreado);
	});

	it('POST /usuarios no debe estar protegido con JwtAuthGuard', () => {
		const guards = Reflect.getMetadata(
			GUARDS_METADATA,
			UsuariosController.prototype.createUser,
		);

		expect(guards).toBeUndefined();
	});

	it('GET /usuarios/:id no debe estar protegido con JwtAuthGuard', () => {
		const guards = Reflect.getMetadata(
			GUARDS_METADATA,
			UsuariosController.prototype.getUser,
		);

		expect(guards).toBeUndefined();
	});

	it('GET /usuarios/:id: retorna usuario si existe', async () => {
		const usuario = {
			id: 1,
			nombre: 'Vicente',
			correo: 'vicente@mail.com',
			ciudad: 'Santiago',
			fechaNacimiento: new Date('2000-01-01'),
		} as Usuario;

		usuariosService.findById.mockResolvedValue(usuario);

		const result = await controller.getUser(1);

		expect(result).toBe(usuario);
	});
	it('GET /usuarios/:id: lanza error si usuario no existe', async () => {
		usuariosService.findById.mockResolvedValue(null);

		await expect(controller.getUser(999)).rejects.toThrow('Usuario no existe');
	});
	it('PATCH /usuarios/:id: llama a updateUsuario del service', async () => {
		const updateDto = { 
			correo: 'vicente@gmail.com',
			ciudad: 'Valparaiso',
		};

		const usuarioActualizado = {
			id: 1,
			nombre: 'Vicente',
			correo: updateDto.correo,
			ciudad: updateDto.ciudad,
			fechaNacimiento: new Date('2000-01-01'),
		} as Usuario;

		usuariosService.updateUsuario.mockResolvedValue(usuarioActualizado);

		const result = await controller.updateUser(1, updateDto);

		expect(usuariosService.updateUsuario).toHaveBeenCalledWith(1, updateDto);
		expect(result).toBe(usuarioActualizado);
	});
	it('PATCH /usuarios/:id: lanza error si se intenta actualizar nombre o fechaNacimiento', async () => {
		const updateDto = { 
			nombre: 'Nuevo Nombre',
			fechaNacimiento: new Date('1990-01-01'),
		};

		usuariosService.updateUsuario.mockRejectedValue(
			new Error('No se permite actualizar nombre ni fechaNacimiento'),
		);

		await expect(controller.updateUser(1, updateDto)).rejects.toThrow('No se permite actualizar nombre ni fechaNacimiento');
		expect(usuariosService.updateUsuario).toHaveBeenCalledWith(1, updateDto);
	});
	it('PATCH /usuarios/:id: erro si usuario no existe', async () => {
		const updateDto = { 
			correo: 'vicente@gmail.com',
		};

		usuariosService.updateUsuario.mockRejectedValue(new Error('Usuario no encontrado'));

		await expect(controller.updateUser(999, updateDto)).rejects.toThrow('Usuario no encontrado');
	});
});
