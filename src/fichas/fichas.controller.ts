import { Controller, Get, Post, Body, Patch, Param, Query, Delete, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FichasService } from './fichas.service';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UsuarioJwt } from '../common/decorators/current-user.decorator';

const ROLES_PERSONAL = ['MECANICO_INDEPENDIENTE', 'TALLER', 'ADMINISTRADOR', 'MECANICO', 'RECEPCIONISTA'];

@ApiTags('fichas')
@ApiBearerAuth()
@Controller('fichas')
export class FichasController {
    constructor(private readonly fichasService: FichasService) { }

    @Get()
    @ApiOperation({ summary: 'Listar fichas de mantenciÃ³n (CLIENTE solo las de sus vehÃ­culos)' })
    listar(
        @CurrentUser() user: UsuarioJwt,
        @Query('vehiculo_id') vehiculoId?: string,
    ) {
      const id = vehiculoId !== undefined && vehiculoId !== '' ? Number(vehiculoId) : undefined;
      return this.fichasService.listar(id, user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Detalle de ficha (CLIENTE solo las de sus vehÃ­culos)' })
    obtener(@Param('id') id: string, @CurrentUser() user: UsuarioJwt) {
      return this.fichasService.obtenerPorId(+id, user);
    }

    @Post()
    @Roles(...ROLES_PERSONAL)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear ficha de mantenciÃ³n (personal del taller)' })
    crearFicha(@Body() createFichaDto: CreateFichaDto, @Request() req: any) {
        // Prevent duplicate creation: check if identical ficha was created recently
        return this.fichasService.crearFicha(createFichaDto, req.user);
    }

    @Patch(':id')
    @Roles(...ROLES_PERSONAL)
    @ApiOperation({ summary: 'Actualizar ficha (personal del taller)' })
    actualizar(@Param('id') id: string, @Body() dto: UpdateFichaDto) {
      return this.fichasService.actualizar(+id, dto);
    }

    @Delete(':id')
    @Roles('TALLER', 'MECANICO_INDEPENDIENTE', 'ADMINISTRADOR')
    @ApiOperation({ summary: 'Eliminar ficha (taller, mecÃ¡nico independiente o admin)' })
    eliminar(@Param('id') id: string) {
      return this.fichasService.eliminar(+id);
    }
}
