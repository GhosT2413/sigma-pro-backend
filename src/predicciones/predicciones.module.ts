import { Module } from '@nestjs/common';
import { PrediccionesController } from './predicciones.controller';
import { PrediccionesService } from './predicciones.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrediccionIa } from './prediccion-ia.entity';
import { AlertasModule } from '../alertas/alertas.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([PrediccionIa]),
    AlertasModule, // Importamos para poder inyectar AlertasService
  ],
  controllers: [PrediccionesController],
  providers: [PrediccionesService],
})
export class PrediccionesModule {}
