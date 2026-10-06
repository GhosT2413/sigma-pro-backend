import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { FichaMantencion, EstadoFicha } from './ficha-mantencion.entity';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';

@Injectable()
export class FichasService {
    constructor(
    @InjectRepository(FichaMantencion)
    private fichasRepository: Repository<FichaMantencion>,
    private vehiculosService: VehiculosService,
  ) {}

  async listar(vehiculoId?: number): Promise<FichaMantencion[]> {
    return await this.fichasRepository.find({
      where: vehiculoId !== undefined ? { vehiculo_id: vehiculoId } : {},
      order: { id: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<FichaMantencion> {
    const ficha = await this.fichasRepository.findOne({ where: { id } });
    if (!ficha) {
      throw new NotFoundException(`Ficha con ID ${id} no encontrada.`);
    }
    return ficha;
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
