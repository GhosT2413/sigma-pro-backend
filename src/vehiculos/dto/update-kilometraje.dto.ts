import { IsNumber, Min } from 'class-validator';

export class UpdateKilometrajeDto {
    @IsNumber()
    @Min(0, { message: 'El kilometraje no puede ser negativo' })
    readonly nuevo_kilometraje: number;
}
