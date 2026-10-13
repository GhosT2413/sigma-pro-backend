import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';

describe('AuthService - registro restringido y payload con taller', () => {
  let service: AuthService;
  let usuariosService: { crearUsuario: jest.Mock; buscarPorEmail: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    usuariosService = {
      crearUsuario: jest.fn().mockResolvedValue({ id: 9, email: 'x@x.cl' }),
      buscarPorEmail: jest.fn().mockResolvedValue({
        id: 9,
        email: 'x@x.cl',
        taller_id: 77,
        role: { nombre: 'TALLER' },
      }),
    };
    jwtService = { sign: jest.fn().mockReturnValue('token-falso') };
    service = new AuthService(
      usuariosService as unknown as UsuariosService,
      jwtService as any,
      {} as any,
    );
  });

  it('rechaza registro con role_id de administrador (4)', async () => {
    await expect(
      service.register({ role_id: 4, email: 'a@b.cl', password_hash: 'x', hasAcceptedTerms: true }),
    ).rejects.toThrow(BadRequestException);
    expect(usuariosService.crearUsuario).not.toHaveBeenCalled();
  });

  it('rechaza registro con roles internos de taller (5/6)', async () => {
    await expect(
      service.register({ role_id: 5, email: 'a@b.cl', password_hash: 'x', hasAcceptedTerms: true }),
    ).rejects.toThrow(BadRequestException);
    expect(usuariosService.crearUsuario).not.toHaveBeenCalled();
  });

  it('acepta registro con roles públicos (1/2/3) y firma JWT con taller_id', async () => {
    await service.register({ role_id: 3, email: 'x@x.cl', password_hash: 'x', hasAcceptedTerms: true });

    expect(usuariosService.crearUsuario).toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 9,
      email: 'x@x.cl',
      role: 'TALLER',
      taller_id: 77,
    });
  });
});
