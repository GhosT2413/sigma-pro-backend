import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrediccionesService } from './predicciones.service';

@ApiTags('predicciones')
@ApiBearerAuth()
@Controller('predicciones')
export class PrediccionesController {
    constructor(private readonly prediccionesService: PrediccionesService) { }

    @Post('generar')
    @ApiOperation({ summary: 'Generar predicción IA de mantención para un vehículo' })
    async generarPrediccion(
        @Body() body: { vehiculo_id: number; kilometraje_actual: number; marca: string; modelo: string; tipo_uso: string }
    ) {
        return await this.prediccionesService.predecirMantencion(
            body.kilometraje_actual,
            body.marca,
            body.modelo,
            body.tipo_uso,
            body.vehiculo_id
        );
    }
}
