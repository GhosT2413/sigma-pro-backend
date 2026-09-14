import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FichaMantencion } from './ficha-mantencion.entity';
import { FichasController } from './fichas.controller';
import { FichasService } from './fichas.service';
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FichaMantencion]),
    VehiculosModule,
    AuthModule, // Importamos para que JwtAuthGuard pueda validar los tokens
  ],
  controllers: [FichasController],
  providers: [FichasService], // No declaramos JwtAuthGuard aquí
})
export class FichasModule {}
