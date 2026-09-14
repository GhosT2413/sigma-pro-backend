import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './create-usuario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('usuarios') // Esta es la URL: localhost:3000/usuarios
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    obtenerUsuarios() {
        return this.usuariosService.obtenerTodos();
    }

    // NUEVA RUTA: POST /usuarios
    // @Body() atrapa el JSON que nos envía Angular y lo mete en el DTO
    @Post()
    crearUsuario(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.crearUsuario(createUsuarioDto);
    }

    @Get('equipo')
    @UseGuards(JwtAuthGuard)
    obtenerMiEquipo() {
        // El rol 2 corresponde a MECANICO_INDEPENDIENTE en tu script SQL
        return this.usuariosService.obtenerPorRol(2);
    }
}
