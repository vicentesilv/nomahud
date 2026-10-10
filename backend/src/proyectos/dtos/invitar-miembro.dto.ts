import { IsEmail, IsEnum, MaxLength } from 'class-validator';

export class InvitarMiembroDto {
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsEnum(['editor', 'lector'])
    rol: 'editor' | 'lector';
}
