import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginDto {
    @ApiProperty({
        description: 'Google ID Token o Credential recibido desde Google Identity Services',
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
    })
    @IsNotEmpty()
    @IsString()
    idToken: string;

    @ApiPropertyOptional({
        description: 'ID del rol asignado en caso de ser nuevo usuario (1: CLIENTE, 2: MECANICO_INDEPENDIENTE, 3: TALLER)',
        default: 1,
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    role_id?: number;
}
