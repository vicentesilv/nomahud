import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUsuarioDto {
	@IsOptional()
	@IsString()
	@MaxLength(150)
	nombre?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	ciudad?: string;

	@IsOptional()
	@IsEmail()
	@MaxLength(255)
	correo?: string;

	@IsOptional()
	@Type(() => Date)
	@IsDate()
	fechaNacimiento?: Date;
}
