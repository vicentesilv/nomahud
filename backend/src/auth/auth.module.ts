import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthToken } from './entitys/auth-token.entity';
import { MailModule } from '../mail/mail.module';
@Module({
  imports: [JwtModule, UsuariosModule, MailModule, TypeOrmModule.forFeature([AuthToken])],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController]
})
export class AuthModule {}
