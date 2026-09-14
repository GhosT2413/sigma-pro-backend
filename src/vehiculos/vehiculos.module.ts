import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './vehiculo.entity';
import { VehiculosController } from './vehiculos.controller';
import { VehiculosService } from './vehiculos.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehiculo]),
    AuthModule, // Importamos AuthModule para que JwtAuthGuard pueda validar los tokens
  ],
  controllers: [VehiculosController],
  providers: [VehiculosService], // No declaramos JwtAuthGuard aquí
  exports: [VehiculosService],
})
export class VehiculosModule { }
