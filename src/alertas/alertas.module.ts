import { Module } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertaMantencion } from './alerta-mantencion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlertaMantencion])],
  providers: [AlertasService],
  exports: [AlertasService], // ¡Importante para conectar con otros módulos!
})
export class AlertasModule { }
