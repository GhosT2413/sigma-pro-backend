import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taller } from './taller.entity';

@Injectable()
export class TalleresService {
  constructor(
    @InjectRepository(Taller)
    private readonly talleresRepository: Repository<Taller>,
  ) {}

  async crear(data: Partial<Taller>): Promise<Taller> {
    const existe = await this.talleresRepository.findOne({ where: { rut_empresa: data.rut_empresa } });
    if (existe) {
      throw new BadRequestException('Ya existe un taller con ese RUT');
    }
    const taller = this.talleresRepository.create(data);
    return await this.talleresRepository.save(taller);
  }

  async obtenerTodos(): Promise<Taller[]> {
    return await this.talleresRepository.find({ where: { activo: true } });
  }

  async buscarPorId(id: number): Promise<Taller> {
    const taller = await this.talleresRepository.findOne({ where: { id } });
    if (!taller) {
      throw new NotFoundException('Taller no encontrado');
    }
    return taller;
  }

  async buscarPorRut(rut: string): Promise<Taller | null> {
    return await this.talleresRepository.findOne({ where: { rut_empresa: rut } });
  }

  async buscarPorUsuarioId(usuarioId: number): Promise<Taller | null> {
    return await this.talleresRepository
      .createQueryBuilder('taller')
      .innerJoin('taller.usuarios', 'usuario', 'usuario.id = :usuarioId', { usuarioId })
      .getOne();
  }

  async actualizar(id: number, data: Partial<Taller>): Promise<Taller> {
    const taller = await this.buscarPorId(id);
    Object.assign(taller, data);
    return await this.talleresRepository.save(taller);
  }

  async desactivar(id: number): Promise<void> {
    const taller = await this.buscarPorId(id);
    taller.activo = false;
    await this.talleresRepository.save(taller);
  }
}