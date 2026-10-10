import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginacionDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export interface Pagina<T> {
    datos: T[];
    total: number;
    pagina: number;
    limite: number;
}

export function paginar<T>(datos: T[], total: number, dto: PaginacionDto): Pagina<T> {
    return {
        datos,
        total,
        pagina: dto.page ?? 1,
        limite: dto.limit ?? 20,
    };
}

export function skipTake(dto: PaginacionDto): { skip: number; take: number } {
    const page = dto.page ?? 1;
    const take = Math.min(dto.limit ?? 20, 100);
    return { skip: (page - 1) * take, take };
}
