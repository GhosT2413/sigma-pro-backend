import { Controller, Get, Post, Body, Delete, Param, ParseIntPipe, Patch, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UsuarioJwt } from '../common/decorators/current-user.decorator';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    /** Quita el hash de contraseÃ±a de cualquier respuesta. */
    private sanitar(usuario: { password_hash?: string } & Record<string, unknown>) {
        const { password_hash: _omitido, ...resto } = usuario;
        return resto;
    }

    private soloCampos<T extends object>(dto: T, permitidos: string[]): Partial<T> {
        const noPermitidos = Object.keys(dto).filter(
            (campo) => !permitidos.includes(campo) && (dto as Record<string, unknown>)[campo] !== undefined,
        );
        if (noPermitidos.length > 0) {
            throw new ForbiddenException(`Campos no permitidos para tu rol: ${noPermitidos.join(', ')}`);
        }
        return Object.fromEntries(
            Object.entries(dto).filter(
                ([campo, valor]) => permitidos.includes(campo) && valor !== undefined,
            ),
        ) as Partial<T>;
    }

    // IMPORTANTE: las rutas 'equipo' deben declararse ANTES de ':id'
    // si no, 'usuarios/equipo' caerÃ­a en ':id' con ParseIntPipe.
    @Get('equipo')
    @Roles('TALLER', 'ADMINISTRADOR')
    @ApiOperation({ summary: 'MecÃ¡nicos independientes (equipo)' })
    obtenerMiEquipo() {
        return this.usuariosService.obtenerPorRol(2);
    }

    @Get('equipo-taller/:tallerId')
    @Roles('MECANICO_INDEPENDIENTE', 'TALLER', 'MECANICO', 'RECEPCIONISTA', 'ADMINISTRADOR')
    @ApiOperation({ summary: 'Equipo de un taller (el taller solo puede ver el suyo)' })
    async obtenerEquipoTaller(
        @Param('tallerId', ParseIntPipe) tallerId: number,
        @CurrentUser() user: UsuarioJwt,
    ) {
        const esAdmin = user.role === 'ADMINISTRADOR';
        const esMecIndependiente = user.role === 'MECANICO_INDEPENDIENTE';
        if (!esAdmin && !esMecIndependiente && Number(tallerId) !== Number(user.tallerId)) {
            throw new ForbiddenException('Solo puedes consultar el equipo de tu taller.');
        }
        return this.usuariosService.obtenerEquipoTallerCompleto(tallerId);
    }

    @Get()
    @ApiOperation({ summary: 'Listar usuarios: admin ve todos, el resto solo el propio registro' })
    async obtenerUsuarios(@CurrentUser() user: UsuarioJwt) {
        if (user.role === 'ADMINISTRADOR') {
            const todos = await this.usuariosService.obtenerTodos();
            return todos.map((u) => this.sanitar(u as unknown as Record<string, unknown>));
        }
        const propio = await this.usuariosService.buscarPorId(user.userId);
        return propio ? [this.sanitar(propio as unknown as Record<string, unknown>)] : [];
    }

    @Get(':id')
    @ApiOperation({ summary: 'Detalle de usuario: propio o personal; clientes solo ven datos bÃ¡sicos pÃºblicos' })
    async obtenerUsuarioPorId(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: UsuarioJwt,
    ) {
        const usuario = await this.usuariosService.buscarPorId(id);
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const esPropio = Number(id) === Number(user.userId);
        const esPrivilegiado =
            user.role === 'ADMINISTRADOR' ||
            ['MECANICO_INDEPENDIENTE', 'TALLER', 'MECANICO', 'RECEPCIONISTA'].includes(user.role);

        if (esPropio || esPrivilegiado) {
            return this.sanitar(usuario as unknown as Record<string, unknown>);
        }

        // Cliente consultando a otro usuario (p.ej. nombre del mecÃ¡nico en una ficha):
        // solo los datos pÃºblicos bÃ¡sicos, nunca email, documentos ni credenciales.
        return {
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            foto_perfil_url: usuario.foto_perfil_url,
            role: usuario.role,
        };
    }

    @Post()
    @Roles('ADMINISTRADOR', 'TALLER')
    @ApiOperation({ summary: 'Crear usuario: admin (cualquier rol) o taller (solo MECANICO/RECEPCIONISTA, taller forzado)' })
    async crearUsuario(
        @Body() createUsuarioDto: CreateUsuarioDto,
        @CurrentUser() user: UsuarioJwt,
    ) {
        const creado = await this.usuariosService.crearUsuario(createUsuarioDto, {
            rol: user.role,
            tallerId: user.tallerId ?? null,
        });
        return this.sanitar(creado as unknown as Record<string, unknown>);
    }

    @Delete(':id')
    @Roles('ADMINISTRADOR', 'TALLER')
    @ApiOperation({ summary: 'Eliminar usuario: admin cualquiera, taller solo de su equipo' })
    async eliminarUsuario(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: UsuarioJwt,
    ) {
        if (user.role !== 'ADMINISTRADOR') {
            const objetivo = await this.usuariosService.buscarPorId(id);
            if (!objetivo || Number(objetivo.taller_id) !== Number(user.tallerId)) {
                throw new ForbiddenException('Solo puedes eliminar usuarios de tu taller.');
            }
        }
        return this.usuariosService.eliminar(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar usuario: admin (total), propio (perfil) o taller (su equipo)' })
    async actualizarUsuario(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUsuarioDto: UpdateUsuarioDto,
        @CurrentUser() user: UsuarioJwt,
    ) {
        if (user.role === 'ADMINISTRADOR') {
            // Edición total (incluye role_id / taller_id / activo), sin exponer password_hash.
            return this.sanitar(
                (await this.usuariosService.actualizar(id, updateUsuarioDto)) as unknown as Record<string, unknown>,
            );
        }

        const objetivo = await this.usuariosService.buscarPorId(id);
        if (!objetivo) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (Number(id) === Number(user.userId)) {
            // EdiciÃ³n del propio perfil: nunca rol, taller, activo ni contraseÃ±a.
            const data = this.soloCampos(updateUsuarioDto, [
                'nombre_completo', 'email', 'telefono', 'rut', 'fecha_nacimiento', 'foto_perfil_url',
            ]);
            return this.sanitar(await this.usuariosService.actualizar(id, data) as unknown as Record<string, unknown>);
        }

        if (user.role === 'TALLER' && Number(objetivo.taller_id) === Number(user.tallerId)) {
            // El taller edita su equipo: datos bÃ¡sicos + rol de equipo (5/6) + activo.
            if (updateUsuarioDto.role_id !== undefined && ![5, 6].includes(Number(updateUsuarioDto.role_id))) {
                throw new ForbiddenException('Un taller solo puede asignar roles MECANICO o RECEPCIONISTA.');
            }
            const data = this.soloCampos(updateUsuarioDto, [
                'nombre_completo', 'email', 'telefono', 'activo', 'role_id',
            ]);
            return this.sanitar(await this.usuariosService.actualizar(id, data) as unknown as Record<string, unknown>);
        }

        throw new ForbiddenException('No tienes permiso para editar este usuario.');
    }
}
