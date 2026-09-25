import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertaMantencion, EstadoAlerta } from './alerta-mantencion.entity';

@Injectable()
export class AlertasService {
    constructor(
    @InjectRepository(AlertaMantencion)
    private alertasRepository: Repository<AlertaMantencion>,
  ) {}

  async listar(filtros: { vehiculoId?: number; estado?: EstadoAlerta } = {}): Promise<AlertaMantencion[]> {
    const where: { vehiculo_id?: number; estado?: EstadoAlerta } = {};
    if (filtros.vehiculoId !== undefined) {
      where.vehiculo_id = filtros.vehiculoId;
    }
    if (filtros.estado !== undefined) {
      where.estado = filtros.estado;
    }
    return await this.alertasRepository.find({
      where,
      order: { id: 'DESC' },
    });
  }

  async actualizarEstado(id: number, estado: EstadoAlerta): Promise<AlertaMantencion> {
    const alerta = await this.alertasRepository.findOne({ where: { id } });
    if (!alerta) {
      throw new NotFoundException(`Alerta con ID ${id} no encontrada.`);
    }
    alerta.estado = estado;
    return await this.alertasRepository.save(alerta);
  }

  async evaluarUmbral(vehiculoId: number, kmActual: number, kmRecomendado: number, componente: string) {
    const diferencia = kmRecomendado - kmActual;
    let tipoAlerta = '';
    let descripcion = '';

    // RF-09: Verde (Al día) no genera registro. Amarillo (<= 1.000 km) y Rojo (Crítico/Vencido).
    if (diferencia < 0) {
      tipoAlerta = 'ROJO';
      descripcion = `Crítico: Mantenimiento de ${componente} vencido por ${Math.abs(diferencia)} km.`;
    } else if (diferencia <= 1000) {
      tipoAlerta = 'AMARILLO';
      descripcion = `Advertencia: Mantenimiento de ${componente} próximo en ${diferencia} km.`;
    } else {
      return null;
    }

    const nuevaAlerta = this.alertasRepository.create({
      vehiculo_id: vehiculoId,
      tipo: tipoAlerta,
      descripcion: descripcion,
      kilometraje_objetivo: kmRecomendado,
    });

    return await this.alertasRepository.save(nuevaAlerta);
  }
}
