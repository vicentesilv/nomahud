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
});
