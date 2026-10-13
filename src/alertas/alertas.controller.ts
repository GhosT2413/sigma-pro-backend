import { Controller, Get, Post, Body, Patch, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertasService } from './alertas.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { UpdateAlertaDto } from './dto/update-alerta.dto';
import { EstadoAlerta } from './alerta-mantencion.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UsuarioJwt } from '../common/decorators/current-user.decorator';

const ROLES_GESTION = ['MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR', 'MECANICO', 'RECEPCIONISTA'];

@ApiTags('alertas')
@ApiBearerAuth()
@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar alertas (CLIENTE solo las de sus vehÃ­culos)' })
  listar(
    @CurrentUser() user: UsuarioJwt,
    @Query('vehiculo_id') vehiculoId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.alertasService.listar(
      {
        vehiculoId: vehiculoId !== undefined && vehiculoId !== '' ? Number(vehiculoId) : undefined,
        estado: estado !== undefined && estado !== '' ? (estado as EstadoAlerta) : undefined,
      },
      user,
    );
  }

  @Post()
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear alerta de mantenciÃ³n para un cliente (personal del taller)' })
  crearAlerta(@Body() dto: CreateAlertaDto) {
    return this.alertasService.crearAlerta(dto);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Cambiar estado de una alerta (no clientes)' })
  actualizarEstado(@Param('id') id: string, @Body() dto: UpdateAlertaDto) {
    return this.alertasService.actualizarEstado(+id, dto.estado);
  }
}
