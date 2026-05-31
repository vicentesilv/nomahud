import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearViajeDto {
    @IsString()
    @MaxLength(255)
    destino: string;

    @IsDateString()
    fechaInicio: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsEnum(['planificado', 'en_curso', 'completado', 'cancelado'])
    estado?: 'planificado' | 'en_curso' | 'completado' | 'cancelado';

    @IsOptional()
    @IsNumber()
    presupuesto?: number;

    @IsOptional()
    @IsString()
    @MaxLength(5)
    moneda?: string;

    @IsOptional()
    @IsString()
    notas?: string;
}
