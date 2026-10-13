import { IsNotEmpty, IsString, IsOptional, IsEmail, IsInt, Validate } from 'class-validator';
import { IsRutChilenoConstraint } from '../validators/rut.validator';

export class CreateClienteDto {
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @IsString()
  readonly nombre_completo: string;

  @IsOptional()
  @IsInt({ message: 'El usuario_id debe ser un número entero' })
  readonly usuario_id?: number;

  @IsOptional()
  @IsString()
  @Validate(IsRutChilenoConstraint)
  readonly rut?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  readonly email?: string;

  @IsOptional()
  @IsString()
  readonly telefono?: string;
}