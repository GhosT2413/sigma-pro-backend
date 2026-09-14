import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly serviciosRepository: Repository<Servicio>,
  ) {}

  async crear(dto: CreateServicioDto): Promise<Servicio> {
    const existe = await this.serviciosRepository.findOne({ where: { nombre: dto.nombre } });
    if (existe) {
      throw new BadRequestException(`El servicio "${dto.nombre}" ya se encuentra registrado.`);
    }

    const nuevoServicio = this.serviciosRepository.create(dto);
    return await this.serviciosRepository.save(nuevoServicio);
  }

  async obtenerTodos(): Promise<Servicio[]> {
    return await this.serviciosRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async obtenerPorId(id: number): Promise<Servicio> {
    const servicio = await this.serviciosRepository.findOne({ where: { id } });
    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado.`);
    }
    return servicio;
  }

  async actualizar(id: number, dto: UpdateServicioDto): Promise<Servicio> {
    const servicio = await this.obtenerPorId(id);
    this.serviciosRepository.merge(servicio, dto);
    return await this.serviciosRepository.save(servicio);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const servicio = await this.obtenerPorId(id);
    await this.serviciosRepository.remove(servicio);
    return { mensaje: `Servicio con ID ${id} eliminado correctamente.` };
  }
}
