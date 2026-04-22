import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuariosModule } from '../usuarios/usuarios.module';
@Module({
  imports: [JwtModule, UsuariosModule],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController]
})
export class AuthModule {}
