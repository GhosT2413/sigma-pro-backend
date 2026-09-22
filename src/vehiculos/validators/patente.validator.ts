import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isPatenteChilena', async: false })
export class IsPatenteChilenaConstraint implements ValidatorConstraintInterface {
  validate(patente: string, _args: ValidationArguments): boolean {
    if (!patente || typeof patente !== 'string') return false;

    const limpia = patente.replace(/[^A-Z0-9]/g, '').toUpperCase();
    // Formatos chilenos: AA1234 (2 letras + 4 números) o AAAA12 (4 letras + 2 números)
    const regex = /^[A-Z]{2}\d{4}$|^[A-Z]{4}\d{2}$/;
    return regex.test(limpia);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'La patente debe tener formato chileno válido (ej: AA1234 o AAAA12).';
  }
}

export function formatearPatente(patente: string): string {
  if (!patente) return '';
  const limpia = patente.replace(/[^A-Z0-9]/g, '').toUpperCase();
  return limpia;
}