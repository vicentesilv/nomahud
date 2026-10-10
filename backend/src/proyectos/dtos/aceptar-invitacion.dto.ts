import { IsString, Length } from 'class-validator';

export class AceptarInvitacionDto {
    @IsString()
    @Length(10, 200)
    token: string;
}
