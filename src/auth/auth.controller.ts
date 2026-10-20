import { Controller, Post, Body, Get, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from '../usuarios/create-usuario.dto';
import { LoginDto } from './login.dto';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/password-recovery.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('google')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión o registrarse con Google OAuth2' })
    loginGoogle(@Body() dto: GoogleLoginDto) {
        return this.authService.loginWithGoogle(dto.idToken, dto.role_id);
    }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Registro público (solo roles CLIENTE, MECANICO_INDEPENDIENTE o TALLER)' })
    register(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.authService.register(createUsuarioDto);
    }

    @ApiBearerAuth()
    @Get('profile')
    @ApiOperation({ summary: 'Perfil del usuario autenticado' })
    getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.userId);
    }

    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 300_000 } })
    @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña (envía correo)' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 300_000 } })
    @ApiOperation({ summary: 'Restablecer contraseña con token' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(
            resetPasswordDto.token,
            resetPasswordDto.newPassword,
            resetPasswordDto.confirmPassword,
        );
    }

    @ApiBearerAuth()
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cambiar contraseña (usuario autenticado)' })
    async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(
            req.user.userId,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword,
            changePasswordDto.confirmPassword,
        );
    }
}
