import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarClienteDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    nombre?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    empresa?: string;

    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    correo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    telefono?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    sitioWeb?: string;

    @IsOptional()
    @IsString()
    notas?: string;
}
