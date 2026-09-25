import { Controller, Get, Post, Body, UseGuards, Patch, Param, Delete, UseInterceptors, UploadedFile, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateKilometrajeDto } from './dto/update-kilometraje.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import PDFDocument from 'pdfkit';
import express from 'express';

@Controller('vehiculos')
@UseGuards(JwtAuthGuard)
export class VehiculosController {
    constructor(private readonly vehiculosService: VehiculosService) { }

    @Get()
    obtenerVehiculos() {
        return this.vehiculosService.obtenerTodos();
    }

    @Get(':id')
    obtenerVehiculo(@Param('id') id: string) {
        return this.vehiculosService.obtenerPorId(+id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearVehiculo(@Body() createVehiculoDto: CreateVehiculoDto) {
        return this.vehiculosService.crearVehiculo(createVehiculoDto);
    }

    @Patch(':id')
    async actualizarVehiculo(@Param('id') id: string, @Body() dto: UpdateVehiculoDto) {
        return this.vehiculosService.actualizar(+id, dto);
    }

    @Delete(':id')
    eliminarVehiculo(@Param('id') id: string) {
        return this.vehiculosService.eliminar(+id);
    }

    @Patch(':id/kilometraje')
    actualizarKilometraje(
        @Param('id') id: string,
        @Body() updateKilometrajeDto: UpdateKilometrajeDto
    ) {
        return this.vehiculosService.actualizarKilometraje(+id, updateKilometrajeDto);
    }

    @Post('importar')
    @UseInterceptors(FileInterceptor('file'))
    async cargarMasiva(@UploadedFile() _file?: unknown) {
        return { mensaje: 'Carga masiva procesada correctamente' };
    }

    @Get(':id/pdf')
    async descargarFichaPDF(@Param('id') id: number, @Res() res: express.Response) {
        const pdf = new PDFDocument();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=vehiculo-${id}.pdf`
        });
        pdf.pipe(res);
        pdf.text(`Historial del Vehículo ID: ${id}`);
        pdf.end();
    }
}
