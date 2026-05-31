import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class ActualizarDocumentoDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsEnum(['proyecto', 'viaje'])
    tipo?: 'proyecto' | 'viaje';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    entidadId?: number;
}
