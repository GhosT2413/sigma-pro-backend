import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateClienteDto {
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @IsString()
  readonly nombre_completo: string;

  @IsOptional()
  @IsString()
  readonly rut?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  readonly email?: string;

  @IsOptional()
  @IsString()
  readonly telefono?: string;
}