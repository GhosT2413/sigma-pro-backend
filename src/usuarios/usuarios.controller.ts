import { Controller, Get, Post, Body, UseGuards, Delete, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';
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

    // NUEVA RUTA: GET /usuarios/equipo-taller/:tallerId - Obtiene el equipo del taller indicado
    @Get('equipo-taller/:tallerId')
    @UseGuards(JwtAuthGuard)
    async obtenerEquipoTaller(@Param('tallerId', ParseIntPipe) tallerId: number) {
        return this.usuariosService.obtenerEquipoTallerCompleto(tallerId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    eliminarUsuario(@Param('id') id: number) {
        return this.usuariosService.eliminar(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    actualizarUsuario(@Param('id', ParseIntPipe) id: number, @Body() updateUsuarioDto: UpdateUsuarioDto) {
        return this.usuariosService.actualizar(id, updateUsuarioDto);
    }
}
