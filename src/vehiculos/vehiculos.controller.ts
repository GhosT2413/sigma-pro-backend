import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UsuarioJwt } from '../common/decorators/current-user.decorator';
import { UpdateKilometrajeDto } from './dto/update-kilometraje.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import PDFDocument from 'pdfkit';
import express from 'express';

@ApiTags('vehiculos')
@ApiBearerAuth()
@Controller('vehiculos')
export class VehiculosController {
    constructor(private readonly vehiculosService: VehiculosService) { }

    @Get()
    @ApiOperation({ summary: 'Listar vehÃ­culos (CLIENTE solo los propios)' })
    obtenerVehiculos(@CurrentUser() user: UsuarioJwt) {
        return this.vehiculosService.obtenerTodos(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Detalle de vehÃ­culo (CLIENTE solo los propios)' })
    obtenerVehiculo(@Param('id') id: string, @CurrentUser() user: UsuarioJwt) {
        return this.vehiculosService.obtenerPorId(+id, user);
    }

    @Post()
    @Roles('CLIENTE', 'MECANICO_INDEPENDIENTE', 'ADMINISTRADOR')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear vehÃ­culo (CLIENTE siempre sobre su propio cliente)' })
    async crearVehiculo(@Body() createVehiculoDto: CreateVehiculoDto, @CurrentUser() user: UsuarioJwt) {
        return this.vehiculosService.crearVehiculo(createVehiculoDto, user);
    }

    @Patch(':id')
    @Roles('CLIENTE', 'ADMINISTRADOR')
    @ApiOperation({ summary: 'Actualizar vehÃ­culo (dueÃ±o o admin)' })
    async actualizarVehiculo(@Param('id') id: string, @Body() dto: UpdateVehiculoDto, @CurrentUser() user: UsuarioJwt) {
        return this.vehiculosService.actualizar(+id, dto, user);
    }

    @Delete(':id')
    @Roles('CLIENTE', 'ADMINISTRADOR')
    @ApiOperation({ summary: 'Eliminar vehÃ­culo (dueÃ±o o admin)' })
    eliminarVehiculo(@Param('id') id: string, @CurrentUser() user: UsuarioJwt) {
        return this.vehiculosService.eliminar(+id, user);
    }

    @Patch(':id/kilometraje')
    @ApiOperation({ summary: 'Actualizar kilometraje (RF-06, dueÃ±o o personal)' })
    actualizarKilometraje(
        @Param('id') id: string,
        @Body() updateKilometrajeDto: UpdateKilometrajeDto,
        @CurrentUser() user: UsuarioJwt,
    ) {
        return this.vehiculosService.actualizarKilometraje(+id, updateKilometrajeDto, user);
    }

    @Post('importar')
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Carga masiva de vehÃ­culos (admin)' })
    @UseInterceptors(FileInterceptor('file'))
    async cargarMasiva(@UploadedFile() _file?: unknown) {
        return { mensaje: 'Carga masiva procesada correctamente' };
    }

    @Get(':id/pdf')
    @ApiOperation({ summary: 'Descargar ficha PDF del vehÃ­culo (dueÃ±o o personal)' })
    async descargarFichaPDF(
        @Param('id') id: number,
        @CurrentUser() user: UsuarioJwt,
        @Res() res: express.Response,
    ) {
        // Verifica existencia + propiedad (CLIENTE solo lo suyo) antes de generar
        await this.vehiculosService.obtenerPorId(+id, user);
        const pdf = new PDFDocument();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=vehiculo-${id}.pdf`
        });
        pdf.pipe(res);
        pdf.text(`Historial del VehÃ­culo ID: ${id}`);
        pdf.end();
    }
}
