import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-jwt-aqui' })
  @IsNotEmpty({ message: 'El token es obligatorio' })
  token: string;

  @ApiProperty({ example: 'NuevaPassword123' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string;

  @ApiProperty({ example: 'NuevaPassword123' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria' })
  confirmPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'PasswordActual123' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  currentPassword: string;

  @ApiProperty({ example: 'NuevaPassword123' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string;

  @ApiProperty({ example: 'NuevaPassword123' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria' })
  confirmPassword: string;
}