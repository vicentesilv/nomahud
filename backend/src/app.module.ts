import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { SaludController } from './salud/salud.controller';
import { InvitadoInterceptor } from './common/interceptors/invitado.interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { MailModule } from './mail/mail.module';
import { PerfilesModule } from './perfiles/perfiles.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { TareasModule } from './tareas/tareas.module';
import { ClientesModule } from './clientes/clientes.module';
import { FinanzasModule } from './finanzas/finanzas.module';
import { TiempoModule } from './tiempo/tiempo.module';
import { ViajesModule } from './viajes/viajes.module';
import { DocumentosModule } from './documentos/documentos.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { StorageModule } from './storage/storage.module';
import { DivisasModule } from './divisas/divisas.module';

@Module({
  imports: [
    //carga de las variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60_000, limit: 10 },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migraciones/*{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        migrationsRun: configService.get<string>('NODE_ENV') === 'production',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsuariosModule,
    MailModule,
    PerfilesModule,
    ProyectosModule,
    TareasModule,
    ClientesModule,
    FinanzasModule,
    TiempoModule,
    ViajesModule,
    DocumentosModule,
    DashboardModule,
    NotificacionesModule,
    StorageModule,
    DivisasModule,
  ],
  controllers: [AppController, SaludController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: InvitadoInterceptor }],
})
export class AppModule {}
