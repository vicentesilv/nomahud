import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
    @Min(0)
    horas?: number;
}
