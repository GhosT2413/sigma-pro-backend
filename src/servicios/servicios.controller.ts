import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('servicios')
@ApiBearerAuth()
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  @Roles('ADMINISTRADOR', 'TALLER')
  @ApiOperation({ summary: 'Crear servicio del catálogo (admin o taller)' })
  crearServicio(@Body() dto: CreateServicioDto) {
    return this.serviciosService.crear(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Catálogo de servicios' })
  listarServicios() {
    return this.serviciosService.obtenerTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un servicio' })
  obtenerPorId(@Param('id') id: string) {
    return this.serviciosService.obtenerPorId(+id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'TALLER')
  @ApiOperation({ summary: 'Actualizar servicio (admin o taller)' })
  actualizar(@Param('id') id: string, @Body() dto: UpdateServicioDto) {
    return this.serviciosService.actualizar(+id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR', 'TALLER')
  @ApiOperation({ summary: 'Eliminar servicio (admin o taller)' })
  eliminar(@Param('id') id: string) {
    return this.serviciosService.eliminar(+id);
  }
}
