import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) { }

    @Post()
    crearCliente(@Body() dto: CreateClienteDto) {
        return this.clientesService.crearCliente(dto);
    }
}
