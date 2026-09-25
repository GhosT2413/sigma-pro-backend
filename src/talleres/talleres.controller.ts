import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { TalleresService } from './talleres.service';
import { Taller } from './taller.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('talleres')
@UseGuards(JwtAuthGuard)
export class TalleresController {
  constructor(private readonly talleresService: TalleresService) {}

  @Post()
  crear(@Body() data: Partial<Taller>) {
    return this.talleresService.crear(data);
  }

  @Get()
  obtenerTodos() {
    return this.talleresService.obtenerTodos();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: number) {
    return this.talleresService.buscarPorId(id);
  }

  @Get('usuario/:usuarioId')
  buscarPorUsuario(@Param('usuarioId') usuarioId: number) {
    return this.talleresService.buscarPorUsuarioId(usuarioId);
  }

  @Patch(':id')
  actualizar(@Param('id') id: number, @Body() data: Partial<Taller>) {
    return this.talleresService.actualizar(id, data);
  }
}