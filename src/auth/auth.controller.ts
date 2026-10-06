import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from '../usuarios/create-usuario.dto';
import { LoginDto } from './login.dto';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/password-recovery.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('register')
    register(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.authService.register(createUsuarioDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.userId);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(
            resetPasswordDto.token,
            resetPasswordDto.newPassword,
            resetPasswordDto.confirmPassword,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(
            req.user.userId,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword,
            changePasswordDto.confirmPassword,
        );
    }
}
