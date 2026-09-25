import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete, Request, ForbiddenException } from '@nestjs/common';
import { FichasService } from './fichas.service';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fichas')
@UseGuards(JwtAuthGuard)
export class FichasController {
    constructor(private readonly fichasService: FichasService) { }

    @Get()
    listar(@Query('vehiculo_id') vehiculoId?: string) {
      const id = vehiculoId !== undefined && vehiculoId !== '' ? Number(vehiculoId) : undefined;
      return this.fichasService.listar(id);
    }

    @Get(':id')
    obtener(@Param('id') id: string) {
      return this.fichasService.obtenerPorId(+id);
    }

    @Post()
    crearFicha(@Body() createFichaDto: CreateFichaDto, @Request() req: any) {
        // Prevent duplicate creation: check if identical ficha was created recently
        return this.fichasService.crearFicha(createFichaDto, req.user);
    }

    @Patch(':id')
    actualizar(@Param('id') id: string, @Body() dto: UpdateFichaDto) {
      return this.fichasService.actualizar(+id, dto);
    }

    @Delete(':id')
    async eliminar(@Param('id') id: string, @Request() req: any) {
      const userRole = req.user?.role;
      // Only TALLER and MECANICO_INDEPENDIENTE can delete fichas
      const allowedRoles = ['TALLER', 'MECANICO_INDEPENDIENTE', 'ADMINISTRADOR'];
      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenException('No tienes permiso para eliminar fichas de mantención');
      }
      return this.fichasService.eliminar(+id);
    }
}
