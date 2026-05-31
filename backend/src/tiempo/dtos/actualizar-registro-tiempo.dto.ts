import { IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class ActualizarRegistroTiempoDto {
    @IsOptional()
    @IsInt()
    proyectoId?: number;

    @IsOptional()
    @IsInt()
    tareaId?: number;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsDateString()
    fecha?: string;

    @IsOptional()
    @IsNumber()
    horas?: number;
}
