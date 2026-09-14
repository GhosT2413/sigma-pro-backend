import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FichaMantencion, EstadoFicha } from './ficha-mantencion.entity';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { VehiculosService } from '../vehiculos/vehiculos.service';

@Injectable()
export class FichasService {
    constructor(
    @InjectRepository(FichaMantencion)
    private fichasRepository: Repository<FichaMantencion>,
    private vehiculosService: VehiculosService, // <-- Inyectamos el servicio de vehículos
  ) {}

  async crearFicha(createFichaDto: CreateFichaDto): Promise<FichaMantencion> {
    const nuevaFicha = this.fichasRepository.create(createFichaDto);
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
}
