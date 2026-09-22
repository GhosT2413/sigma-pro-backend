import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearCliente(@Body() dto: CreateClienteDto) {
        return this.clientesService.crearCliente(dto);
    }

    @Get()
    listarClientes() {
        return this.clientesService.obtenerTodos();
    }

    @Get(':id')
    obtenerCliente(@Param('id') id: string) {
        return this.clientesService.obtenerPorId(+id);
    }

    @Patch(':id')
    async actualizarCliente(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
        return this.clientesService.actualizar(+id, dto);
    }

    @Delete(':id')
    eliminarCliente(@Param('id') id: string) {
        return this.clientesService.eliminar(+id);
    }
}
