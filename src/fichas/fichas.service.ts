import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { FichaMantencion, EstadoFicha } from './ficha-mantencion.entity';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { UsuarioJwt } from '../common/decorators/current-user.decorator';

@Injectable()
export class FichasService {
    constructor(
    @InjectRepository(FichaMantencion)
    private fichasRepository: Repository<FichaMantencion>,
    private vehiculosService: VehiculosService,
  ) {}

  async listar(vehiculoId?: number, user?: UsuarioJwt): Promise<FichaMantencion[]> {
    // Scoping: CLIENTE solo ve fichas de SUS vehículos.
    if (user?.role === 'CLIENTE') {
      const qb = this.fichasRepository
        .createQueryBuilder('f')
        .where(
          'f.vehiculo_id IN (SELECT v.id FROM vehiculos v INNER JOIN clientes c ON c.id = v.cliente_id WHERE c.usuario_id = :userId)',
          { userId: user.userId },
        )
        .orderBy('f.id', 'DESC');
      if (vehiculoId !== undefined) {
        qb.andWhere('f.vehiculo_id = :vehiculoId', { vehiculoId });
      }
      return await qb.getMany();
    }
    return await this.fichasRepository.find({
      where: vehiculoId !== undefined ? { vehiculo_id: vehiculoId } : {},
      order: { id: 'DESC' },
    });
  }

  async obtenerPorId(id: number, user?: UsuarioJwt): Promise<FichaMantencion> {
    const ficha = await this.fichasRepository.findOne({ where: { id } });
    if (!ficha) {
      throw new NotFoundException(`Ficha con ID ${id} no encontrada.`);
    }
    if (user?.role === 'CLIENTE') {
      await this.verificarFichaDeCliente(ficha.vehiculo_id, user.userId);
    }
    return ficha;
  }

  /** CLIENTE solo puede acceder a fichas de vehículos de su propio perfil. */
  private async verificarFichaDeCliente(vehiculoId: number, userId: number): Promise<void> {
    const filas = await this.fichasRepository.query(
      'SELECT 1 FROM vehiculos v INNER JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ? AND c.usuario_id = ? LIMIT 1',
      [vehiculoId, userId],
    );
    if (!filas || filas.length === 0) {
      throw new ForbiddenException('Esta ficha no corresponde a tus vehículos.');
    }
  }

  async crearFicha(createFichaDto: CreateFichaDto, user: any): Promise<FichaMantencion> {
    // Un MECANICO_INDEPENDIENTE que crea la ficha es quien atendió el vehículo:
    // se fuerza su propio id aunque el cliente envíe otro mecanico_id.
    const dto: CreateFichaDto =
      user?.role === 'MECANICO_INDEPENDIENTE' && user?.userId
        ? { ...createFichaDto, mecanico_id: user.userId }
        : createFichaDto;

    // Prevent duplicate creation: check for identical ficha created in last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existing = await this.fichasRepository.findOne({
      where: {
        vehiculo_id: dto.vehiculo_id,
        kilometraje_ingreso: dto.kilometraje_ingreso,
        descripcion: dto.descripcion || '',
        created_at: MoreThan(fiveSecondsAgo),
      },
    });

    if (existing) {
      // Return existing instead of creating duplicate
      return existing;
    }

    const nuevaFicha = this.fichasRepository.create(dto);
    const fichaGuardada = await this.fichasRepository.save(nuevaFicha);

    // Si la ficha entra como LISTO, actualizamos el kilometraje del vehículo
    if (fichaGuardada.estado === EstadoFicha.LISTO) {
      await this.vehiculosService.actualizarKilometraje(
        fichaGuardada.vehiculo_id,
        { nuevo_kilometraje: fichaGuardada.kilometraje_ingreso }
      );
    }

    return fichaGuardada;
  }

  async actualizar(id: number, dto: UpdateFichaDto): Promise<FichaMantencion> {
    const ficha = await this.obtenerPorId(id);
    this.fichasRepository.merge(ficha, dto);
    return await this.fichasRepository.save(ficha);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const ficha = await this.obtenerPorId(id);
    await this.fichasRepository.remove(ficha);
    return { mensaje: `Ficha con ID ${id} eliminada correctamente.` };
  }
}
