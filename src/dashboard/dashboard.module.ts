import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { AlertaMantencion } from '../alertas/alerta-mantencion.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehiculo, AlertaMantencion]),
    AuthModule, // Importamos para que JwtAuthGuard pueda validar los tokens
  ],
  controllers: [DashboardController],
  providers: [DashboardService], // No declaramos JwtAuthGuard aquí
})
export class DashboardModule {}
