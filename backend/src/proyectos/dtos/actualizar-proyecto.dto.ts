import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarProyectoDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsEnum(['activo', 'completado', 'en_pausa', 'cancelado'])
    estado?: 'activo' | 'completado' | 'en_pausa' | 'cancelado';

    @IsOptional()
    @IsEnum(['baja', 'media', 'alta', 'critica'])
    prioridad?: 'baja' | 'media' | 'alta' | 'critica';

    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    cliente?: string;

    @IsOptional()
    @IsInt()
    clienteId?: number;

    @IsOptional()
    @IsNumber()
    presupuesto?: number;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    moneda?: string;
}
