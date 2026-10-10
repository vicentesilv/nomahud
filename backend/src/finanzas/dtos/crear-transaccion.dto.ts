import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearTransaccionDto {
    @IsEnum(['ingreso', 'gasto'])
    tipo: 'ingreso' | 'gasto';

    @IsString()
    @MaxLength(100)
    categoria: string;

    @IsNumber()
    @Min(0)
    monto: number;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    moneda?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsDateString()
    fecha: string;

    @IsOptional()
    @IsInt()
    proyectoId?: number;

    @IsOptional()
    @IsInt()
    clienteId?: number;
}
