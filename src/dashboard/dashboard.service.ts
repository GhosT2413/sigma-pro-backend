import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo, EstadoVehiculo } from '../vehiculos/vehiculo.entity';
import { AlertaMantencion, EstadoAlerta } from '../alertas/alerta-mantencion.entity';

@Injectable()
export class DashboardService {
    constructor(
    @InjectRepository(Vehiculo)
    private vehiculosRepo: Repository<Vehiculo>,
    @InjectRepository(AlertaMantencion)
    private alertasRepo: Repository<AlertaMantencion>,
  ) {}

  async obtenerMetricasGenerales() {
    const totalVehiculos = await this.vehiculosRepo.count();
    const vehiculosEnTaller = await this.vehiculosRepo.count({ 
      where: { estado: EstadoVehiculo.EN_MANTENIMIENTO } 
    });
    const alertasActivas = await this.alertasRepo.count({ 
      where: { estado: EstadoAlerta.PENDIENTE } 
    });

    return {
      total_vehiculos: totalVehiculos,
      vehiculos_en_taller: vehiculosEnTaller,
      alertas_activas: alertasActivas,
      timestamp: new Date()
    };
  }
}
