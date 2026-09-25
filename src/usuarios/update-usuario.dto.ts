import { IsOptional, IsString, IsDateString, IsBoolean, IsInt, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUsuarioDto {
    @IsOptional()
    @IsString()
    readonly nombre_completo?: string;

    @IsOptional()
    @IsString()
    readonly email?: string;

    @IsOptional()
    @IsString()
    @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
    password_hash?: string;

    @IsOptional()
    @IsString()
    readonly telefono?: string;

    @IsOptional()
    @IsBoolean()
    readonly activo?: boolean;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD' })
    readonly fecha_nacimiento?: string;

    @IsOptional()
    @IsString()
    readonly foto_perfil_url?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El rol debe ser un identificador numérico válido' })
    readonly role_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El taller_id debe ser un número válido' })
    readonly taller_id?: number;
}