import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { UpdateAlertaDto } from './dto/update-alerta.dto';
import { EstadoAlerta } from './alerta-mantencion.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('alertas')
@UseGuards(JwtAuthGuard)
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Get()
  listar(
    @Query('vehiculo_id') vehiculoId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.alertasService.listar({
      vehiculoId: vehiculoId !== undefined && vehiculoId !== '' ? Number(vehiculoId) : undefined,
      estado: estado !== undefined && estado !== '' ? (estado as EstadoAlerta) : undefined,
    });
  }

  @Patch(':id')
  actualizarEstado(@Param('id') id: string, @Body() dto: UpdateAlertaDto) {
    return this.alertasService.actualizarEstado(+id, dto.estado);
  }
}
