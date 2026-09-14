import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('servicios')
@UseGuards(JwtAuthGuard)
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  crearServicio(@Body() dto: CreateServicioDto) {
    return this.serviciosService.crear(dto);
  }

  @Get()
  listarServicios() {
    return this.serviciosService.obtenerTodos();
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.serviciosService.obtenerPorId(+id);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: UpdateServicioDto) {
    return this.serviciosService.actualizar(+id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.serviciosService.eliminar(+id);
  }
}
