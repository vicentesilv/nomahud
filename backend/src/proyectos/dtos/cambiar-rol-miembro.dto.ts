import { IsEnum } from 'class-validator';

export class CambiarRolMiembroDto {
    @IsEnum(['editor', 'lector'])
    rol: 'editor' | 'lector';
}
