import { IsString, MinLength } from 'class-validator';

export class ConfirmarCuentaDto {
	@IsString()
	@MinLength(1)
	token: string;
}