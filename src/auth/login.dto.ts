import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
    @IsEmail({}, { message: 'El formato del correo es inválido' })
    readonly email: string;

    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @IsString()
    readonly password: string;
}
