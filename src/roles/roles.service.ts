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
      { id: 3, nombre: 'TALLER', descripcion: 'Encargado de taller' },
      { id: 4, nombre: 'ADMINISTRADOR', descripcion: 'Administrador del sistema' },
      { id: 5, nombre: 'MECANICO', descripcion: 'Mecanico de taller' },
      { id: 6, nombre: 'RECEPCIONISTA', descripcion: 'Recepcionista de taller' },
    ];

    // Renombrar roles legacy para que coincidan con el tipo Rol del frontend
    const legacyNames: Record<string, string> = {
      'ENCARGADO_TALLER': 'TALLER',
      'ADMIN': 'ADMINISTRADOR',
      'MECANICO': 'MECANICO',
      'RECEPCIONISTA': 'RECEPCIONISTA',
    };
    for (const [oldName, newName] of Object.entries(legacyNames)) {
      const legacy = await this.rolesRepository.findOne({ where: { nombre: oldName } });
      if (legacy) {
        legacy.nombre = newName;
        await this.rolesRepository.save(legacy);
        this.logger.log(`Rol renombrado: ${oldName} → ${newName}`);
      }
    }

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