import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUsuarioDto {
	@IsOptional()
	@IsString()
	@MaxLength(150)
	nombre?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	ciudad?: string;
}
