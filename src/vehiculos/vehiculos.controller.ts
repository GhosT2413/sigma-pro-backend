import { Controller, Get, Post, Body, UseGuards, Patch, Param, UseInterceptors, UploadedFile, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateKilometrajeDto } from './dto/update-kilometraje.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearVehiculo(@Body() createVehiculoDto: CreateVehiculoDto) {
        return this.vehiculosService.crearVehiculo(createVehiculoDto);
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
    async cargarMasiva(@UploadedFile() file: Express.Multer.File) {
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
