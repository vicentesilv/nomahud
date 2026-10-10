import { IsString, Length } from 'class-validator';

export class RenovarTokenDto {
    @IsString()
    @Length(10, 300)
    refreshToken: string;
}
