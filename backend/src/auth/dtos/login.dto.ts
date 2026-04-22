import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  correo: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  contrasena: string;
}