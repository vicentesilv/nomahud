import { IsEmail, MaxLength } from 'class-validator';

export class ReenviarConfirmacionDto {
	@IsEmail()
	@MaxLength(255)
	correo: string;
}