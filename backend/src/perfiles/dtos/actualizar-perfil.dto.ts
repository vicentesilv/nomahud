import { IsArray, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ActualizarPerfilDto {
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    bio?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    avatarUrl?: string;

    @IsOptional()
    @IsUrl()
    @MaxLength(255)
    sitioWeb?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsArray()
    idiomas?: { idioma: string; nivel: string }[];

    @IsOptional()
    @IsString()
    @MaxLength(100)
    zonaHoraria?: string;

    @IsOptional()
    @IsEnum(['disponible', 'ocupado', 'noDisponible'])
    estadoLaboral?: 'disponible' | 'ocupado' | 'noDisponible';

    @IsOptional()
    @IsString()
    @MaxLength(100)
    paisActual?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    ciudadActual?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    monedaPreferida?: string;
}
