import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarTransaccionDto {
    @IsOptional()
    @IsEnum(['ingreso', 'gasto'])
    tipo?: 'ingreso' | 'gasto';

    @IsOptional()
    @IsString()
    @MaxLength(100)
    categoria?: string;

    @IsOptional()
    @IsNumber()
    monto?: number;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    moneda?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsDateString()
    fecha?: string;

    @IsOptional()
    @IsInt()
    proyectoId?: number;

    @IsOptional()
    @IsInt()
    clienteId?: number;
}
