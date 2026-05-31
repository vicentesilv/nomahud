import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CrearDocumentoDto {
    @IsEnum(['proyecto', 'viaje'])
    tipo: 'proyecto' | 'viaje';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    entidadId?: number;

    @IsOptional()
    @IsString()
    nombre?: string;
}
