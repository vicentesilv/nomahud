import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearTareaDto {
    @IsString()
    @MaxLength(255)
    titulo: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsEnum(['pendiente', 'en_progreso', 'completada', 'cancelada'])
    estado?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

    @IsOptional()
    @IsEnum(['baja', 'media', 'alta', 'critica'])
    prioridad?: 'baja' | 'media' | 'alta' | 'critica';

    @IsOptional()
    @IsDateString()
    fechaVencimiento?: string;

    @IsOptional()
    @IsInt()
    estimacionHoras?: number;

    @IsInt()
    proyectoId: number;

    @IsOptional()
    @IsInt()
    asignadoAId?: number;
}
