import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilesController } from './perfiles.controller';
import { PerfilesService } from './perfiles.service';
import { Perfil } from './entities/perfil.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Perfil])],
    controllers: [PerfilesController],
    providers: [PerfilesService],
    exports: [PerfilesService],
})
export class PerfilesModule {}
