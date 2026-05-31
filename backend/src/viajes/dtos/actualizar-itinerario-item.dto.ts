import { IsDateString, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarItinerarioItemDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    lugar?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha no entra en el rango del viaje' })
    fecha?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsNumber()
    costo?: number;

    @IsOptional()
    @IsNumber()
    orden?: number;
}
