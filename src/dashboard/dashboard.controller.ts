import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('metricas')
    @ApiOperation({ summary: 'Métricas generales del panel' })
    obtenerMetricas() {
        return this.dashboardService.obtenerMetricasGenerales();
    }
}
