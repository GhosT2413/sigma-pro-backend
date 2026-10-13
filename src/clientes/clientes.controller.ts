import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UsuarioJwt } from '../common/decorators/current-user.decorator';

@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) { }

    @Post()
    @Roles('ADMINISTRADOR', 'CLIENTE')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear cliente: admin cualquiera, CLIENTE siempre el suyo propio' })
    async crearCliente(@Body() dto: CreateClienteDto, @Request() req: any) {
        return this.clientesService.crearCliente(dto, req.user);
    }

    @Get()
    @ApiOperation({ summary: 'Listar clientes (CLIENTE solo el propio)' })
    listarClientes(@CurrentUser() user: UsuarioJwt) {
        return this.clientesService.obtenerTodos(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Detalle de cliente (CLIENTE solo el propio)' })
    obtenerCliente(@Param('id') id: string, @CurrentUser() user: UsuarioJwt) {
        return this.clientesService.obtenerPorId(+id, user);
    }

    @Patch(':id')
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Actualizar cliente (admin)' })
    async actualizarCliente(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
        return this.clientesService.actualizar(+id, dto);
    }

    @Delete(':id')
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Eliminar cliente (admin)' })
    eliminarCliente(@Param('id') id: string) {
        return this.clientesService.eliminar(+id);
    }
}
