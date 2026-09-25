import { IsNotEmpty, IsString, IsEmail, IsOptional, IsInt, IsBoolean, MinLength, IsDateString, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import { IsRutChilenoConstraint } from '../clientes/validators/rut.validator';

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
    @Type(() => Number)
    @IsInt({ message: 'El rol debe ser un identificador numérico válido' })
    readonly role_id: number;

    // ── Términos y Condiciones ──
    @IsNotEmpty({ message: 'Debes aceptar los Términos y Condiciones' })
    @IsBoolean({ message: 'El campo hasAcceptedTerms debe ser true o false' })
    readonly hasAcceptedTerms: boolean;

    // ── Cliente (role_id = 1) ──
    @IsOptional()
    @IsString()
    @Validate(IsRutChilenoConstraint)
    readonly rut?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
    readonly fecha_nacimiento?: string;

    // ── Asociación a Taller (para MECANICO=5, RECEPCIONISTA=6) ──
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El taller_id debe ser un número válido' })
    readonly taller_id?: number;

    // ── Mecánico Independiente (role_id = 2) ──
    @IsOptional()
    @IsString()
    readonly cedula_frente_url?: string;

    @IsOptional()
    @IsString()
    readonly cedula_reverso_url?: string;

    @IsOptional()
    @IsString()
    readonly certificado_antecedentes_url?: string;

    // ── Taller Mecánico (role_id = 3) ──
    @IsOptional()
    @IsString()
    readonly rut_empresa?: string;

    @IsOptional()
    @IsString()
    readonly patente_comercial?: string;

    @IsOptional()
    @IsString()
    readonly comprobante_domicilio_url?: string;

    @IsOptional()
    @IsString()
    readonly representante_legal?: string;
}