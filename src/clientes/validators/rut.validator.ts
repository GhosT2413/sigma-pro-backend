import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isRutChileno', async: false })
export class IsRutChilenoConstraint implements ValidatorConstraintInterface {
  validate(rut: string, _args: ValidationArguments): boolean {
    if (!rut || typeof rut !== 'string') return false;

    const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length < 2) return false;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const resto = suma % 11;
    const dvEsperadoCalculado = 11 - resto;
    let dvEsperado = '';
    if (dvEsperadoCalculado === 11) dvEsperado = '0';
    else if (dvEsperadoCalculado === 10) dvEsperado = 'K';
    else dvEsperado = dvEsperadoCalculado.toString();

    return dv === dvEsperado;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'El RUT ingresado no es válido (verifique el dígito verificador).';
  }
}

export function formatearRutBackend(rut: string): string {
  if (!rut) return '';
  const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length <= 1) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
}

export function limpiarRut(rut: string): string {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}