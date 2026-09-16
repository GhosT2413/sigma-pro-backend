import { IsNotEmpty, IsString, IsEmail, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateUsuarioDto {
    @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
    @IsString()
    readonly nombre_completo: string;

    @IsNotEmpty({ message: 'El correo es obligatorio' })
    @IsEmail({}, { message: 'El formato del correo es inválido' })
    readonly email: string;

    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @IsString()
    @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
    readonly password_hash: string;

    @IsOptional()
    @IsString()
    readonly telefono?: string;

    @IsNotEmpty({ message: 'El rol es obligatorio' })
    @IsInt({ message: 'El rol debe ser un identificador numérico válido' })
    readonly role_id: number;
}