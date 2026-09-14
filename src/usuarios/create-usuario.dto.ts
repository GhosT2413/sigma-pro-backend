// src/usuarios/dto/create-usuario.dto.ts
export class CreateUsuarioDto {
    readonly nombre_completo: string;
    readonly email: string;
    readonly password_hash: string; // Angular nos enviará la contraseña plana temporalmente aquí
    readonly telefono?: string; // El signo ? indica que es opcional
    readonly role_id: number; // Necesitamos saber qué rol tendrá el usuario
}