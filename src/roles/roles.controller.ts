import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@ApiOkResponse({ description: 'Catálogo de roles activos' })
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar roles del sistema (requiere autenticación)' })
  obtenerRoles() {
    return this.rolesService.obtenerTodos();
  }
}
