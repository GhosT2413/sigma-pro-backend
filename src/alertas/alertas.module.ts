import { Module } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { AlertasController } from './alertas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertaMantencion } from './alerta-mantencion.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertaMantencion]),
    AuthModule, // Para que JwtAuthGuard pueda validar los tokens
  ],
  controllers: [AlertasController],
  providers: [AlertasService],
  exports: [AlertasService], // ¡Importante para conectar con otros módulos!
})
export class AlertasModule { }
