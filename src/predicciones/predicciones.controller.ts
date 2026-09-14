import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PrediccionesService } from './predicciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('predicciones')
@UseGuards(JwtAuthGuard)
export class PrediccionesController {
    constructor(private readonly prediccionesService: PrediccionesService) { }

    @Post('generar')
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
