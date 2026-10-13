import { Controller, Get, Post, Body, Param, Patch, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TalleresService } from './talleres.service';
import { Taller } from './taller.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UsuarioJwt } from '../common/decorators/current-user.decorator';

@ApiTags('talleres')
@ApiBearerAuth()
@Controller('talleres')
export class TalleresController {
  constructor(private readonly talleresService: TalleresService) {}

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Crear taller (admin)' })
  crear(@Body() data: Partial<Taller>) {
    return this.talleresService.crear(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar talleres activos' })
  obtenerTodos() {
    return this.talleresService.obtenerTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de taller' })
  buscarPorId(@Param('id') id: number) {
    return this.talleresService.buscarPorId(id);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Taller de un usuario (fallback de Mi Equipo)' })
  buscarPorUsuario(@Param('usuarioId') usuarioId: number) {
    return this.talleresService.buscarPorUsuarioId(usuarioId);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'TALLER')
  @ApiOperation({ summary: 'Actualizar taller (admin o el taller dueÃ±o)' })
  async actualizar(
    @Param('id') id: number,
    @Body() data: Partial<Taller>,
    @CurrentUser() user: UsuarioJwt,
  ) {
    if (user.role !== 'ADMINISTRADOR' && Number(user.tallerId) !== Number(id)) {
      throw new ForbiddenException('Solo puedes editar tu propio taller.');
    }
    return this.talleresService.actualizar(id, data);
  }
}
