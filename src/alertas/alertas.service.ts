import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertaMantencion, EstadoAlerta } from './alerta-mantencion.entity';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { UsuarioJwt } from '../common/decorators/current-user.decorator';

@Injectable()
export class AlertasService {
    constructor(
    @InjectRepository(AlertaMantencion)
    private alertasRepository: Repository<AlertaMantencion>,
  ) {}

  async listar(
    filtros: { vehiculoId?: number; estado?: EstadoAlerta } = {},
    user?: UsuarioJwt,
  ): Promise<AlertaMantencion[]> {
    // Scoping: CLIENTE solo recibe alertas de SUS vehículos.
    if (user?.role === 'CLIENTE') {
      const qb = this.alertasRepository
        .createQueryBuilder('a')
        .where(
          'a.vehiculo_id IN (SELECT v.id FROM vehiculos v INNER JOIN clientes c ON c.id = v.cliente_id WHERE c.usuario_id = :userId)',
          { userId: user.userId },
        )
        .orderBy('a.id', 'DESC');
      if (filtros.vehiculoId !== undefined) {
        qb.andWhere('a.vehiculo_id = :vehiculoId', { vehiculoId: filtros.vehiculoId });
      }
      if (filtros.estado !== undefined) {
        qb.andWhere('a.estado = :estado', { estado: filtros.estado });
      }
      return await qb.getMany();
    }

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

  async crearAlerta(dto: CreateAlertaDto): Promise<AlertaMantencion> {
    const filas = await this.alertasRepository.query(
      'SELECT id FROM vehiculos WHERE id = ?',
      [dto.vehiculo_id],
    );
    if (!filas || filas.length === 0) {
      throw new BadRequestException('El vehículo especificado no existe.');
    }
    const nueva = this.alertasRepository.create({
      vehiculo_id: dto.vehiculo_id,
      tipo: dto.tipo,
      descripcion: dto.descripcion,
      ...(dto.kilometraje_objetivo !== undefined
        ? { kilometraje_objetivo: dto.kilometraje_objetivo }
        : {}),
      ...(dto.fecha_objetivo !== undefined
        ? { fecha_objetivo: new Date(dto.fecha_objetivo) }
        : {}),
      estado: dto.estado ?? EstadoAlerta.PENDIENTE,
    });
    return await this.alertasRepository.save(nueva);
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
