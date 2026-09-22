import { IsNotEmpty, IsString, IsOptional, IsEmail, Validate } from 'class-validator';
import { IsRutChilenoConstraint } from '../validators/rut.validator';

export class CreateClienteDto {
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @IsString()
  readonly nombre_completo: string;

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