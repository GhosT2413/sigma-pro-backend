import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

function crearStrategy() {
  const configService = { get: jest.fn().mockReturnValue('secreto-de-prueba') } as unknown as ConfigService;
  return new JwtStrategy(configService);
}

describe('JwtStrategy', () => {
  it('acepta el JWT de sesión normal', async () => {
    const strategy = crearStrategy();

    await expect(
      strategy.validate({ sub: 1, email: 'u@u.cl', role: 'CLIENTE', taller_id: null }),
    ).resolves.toEqual({
      userId: 1,
      email: 'u@u.cl',
      role: 'CLIENTE',
      tallerId: null,
    });
  });

  it('rechaza el JWT de restablecimiento usado como Bearer de sesión', async () => {
    const strategy = crearStrategy();

    await expect(
      strategy.validate({ sub: 1, email: 'u@u.cl', type: 'password-reset' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
