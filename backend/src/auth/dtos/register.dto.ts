import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(150)
  nombre: string;

  @IsEmail()
  @MaxLength(255)
  correo: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  contrasena: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ciudad?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;
}