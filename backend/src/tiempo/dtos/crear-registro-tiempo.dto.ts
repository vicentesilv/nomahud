import { IsDateString, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearRegistroTiempoDto {
    @IsInt()
    proyectoId: number;

    @IsOptional()
    @IsInt()
    tareaId?: number;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsDateString()
    fecha: string;

    @IsNumber()
    @Min(0)
    horas: number;
}
