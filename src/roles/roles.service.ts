import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async seedRoles(): Promise<void> {
    const roles = [
      { id: 1, nombre: 'CLIENTE', descripcion: 'Cliente propietario de vehiculos' },
      { id: 2, nombre: 'MECANICO_INDEPENDIENTE', descripcion: 'Mecanico independiente' },
      { id: 3, nombre: 'ENCARGADO_TALLER', descripcion: 'Encargado de taller' },
      { id: 4, nombre: 'ADMIN', descripcion: 'Administrador del sistema' },
    ];

    for (const role of roles) {
      const existe = await this.rolesRepository.findOne({ where: { nombre: role.nombre } });
      if (!existe) {
        await this.rolesRepository.save(this.rolesRepository.create(role));
        this.logger.log(`Rol creado: ${role.nombre} (id: ${role.id})`);
      }
    }
  }

  async obtenerTodos(): Promise<Role[]> {
    return await this.rolesRepository.find({
      where: { activo: true },
      order: { id: 'ASC' },
    });
  }
}