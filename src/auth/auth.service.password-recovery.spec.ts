import { createHash } from 'crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../messaging/email.service';

const HASH_ACTUAL = '$2b$12$abcdefghijklmnopqrstuv';
const HUELLA = createHash('sha256').update(HASH_ACTUAL).digest('hex').slice(0, 32);

type MockUsuarios = {
  buscarPorEmail: jest.Mock;
  buscarPorId: jest.Mock;
  actualizar: jest.Mock;
};
type MockJwt = { sign: jest.Mock; verify: jest.Mock };
type MockEmail = { sendPasswordResetEmail: jest.Mock };

function construir(overrides?: {
  usuario?: any;
  payload?: any;
  verifyError?: Error;
  emailResultado?: { success: boolean };
}) {
  const usuariosService: MockUsuarios = {
    buscarPorEmail: jest.fn().mockResolvedValue(
      overrides?.usuario === undefined
        ? { id: 1, email: 'u@u.cl', password_hash: HASH_ACTUAL, role: { nombre: 'CLIENTE' } }
        : overrides.usuario,
    ),
    buscarPorId: jest.fn(),
    actualizar: jest.fn().mockResolvedValue({}),
  };
  const jwtService: MockJwt = {
    sign: jest.fn().mockReturnValue('token-reset-falso'),
    verify: overrides?.verifyError
      ? jest.fn().mockImplementation(() => {
          throw overrides.verifyError;
        })
      : jest.fn().mockReturnValue(
          overrides?.payload ?? {
            sub: 1,
            email: 'u@u.cl',
            type: 'password-reset',
            pwdv: HUELLA,
          },
        ),
  };
  const emailService: MockEmail = {
    sendPasswordResetEmail: jest
      .fn()
      .mockResolvedValue(overrides?.emailResultado ?? { success: true }),
  };

  const service = new AuthService(
    usuariosService as unknown as UsuariosService,
    jwtService as unknown as JwtService,
    emailService as unknown as EmailService,
  );

  return { service, usuariosService, jwtService, emailService };
}

describe('AuthService - recuperación de contraseña por correo', () => {
  describe('forgotPassword', () => {
    it('firma un JWT de tipo password-reset con la huella de la contraseña actual y envía el correo', async () => {
      const { service, jwtService, emailService } = construir();

      const res = await service.forgotPassword('u@u.cl');

      expect(res.message).toBe(
        'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 1, email: 'u@u.cl', type: 'password-reset', pwdv: HUELLA },
        { expiresIn: '1h' },
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'u@u.cl',
        'token-reset-falso',
      );
    });

    it('responde siempre el mismo mensaje aunque el email no exista (no revela cuentas)', async () => {
      const { service, emailService } = construir({ usuario: null });

      const res = await service.forgotPassword('noexiste@u.cl');

      expect(res.message).toBe(
        'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      );
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('no lanza excepción si el envío del correo falla (solo loguea)', async () => {
      const { service } = construir({ emailResultado: { success: false } });

      await expect(service.forgotPassword('u@u.cl')).resolves.toEqual({
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      });
    });
  });

  describe('resetPassword', () => {
    it('rechaza si las contraseñas no coinciden', async () => {
      const { service } = construir();

      await expect(
        service.resetPassword('token', 'Nueva1234', 'Distinta1234'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un token inválido o expirado', async () => {
      const { service } = construir({ verifyError: new Error('jwt expired') });

      await expect(
        service.resetPassword('token-viejo', 'Nueva1234', 'Nueva1234'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza un JWT que no sea de restablecimiento', async () => {
      const { service } = construir({ payload: { sub: 1, email: 'u@u.cl', type: 'access' } });

      await expect(
        service.resetPassword('token', 'Nueva1234', 'Nueva1234'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza un token ya utilizado (la huella ya no coincide tras el cambio)', async () => {
      const { service } = construir({
        payload: { sub: 1, email: 'u@u.cl', type: 'password-reset', pwdv: HUELLA },
        // El usuario cambió de contraseña: su hash (y por lo tanto la huella) es otro.
        usuario: { id: 1, email: 'u@u.cl', password_hash: '$2b$12$otrohashdistintoxyz' },
      });

      await expect(
        service.resetPassword('token', 'Nueva1234', 'Nueva1234'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('guarda la contraseña en PLANO para que UsuariosService la encripte una sola vez (regresión del doble hash)', async () => {
      const { service, usuariosService } = construir();

      const res = await service.resetPassword('token', 'NuevaPassword123', 'NuevaPassword123');

      expect(res.message).toBe('Contraseña actualizada correctamente');
      // Si llegara hasheada, UsuariosService la hashearía de nuevo y el login fallaría.
      expect(usuariosService.actualizar).toHaveBeenCalledWith(1, {
        password_hash: 'NuevaPassword123',
      });
    });

    it('rechaza el token si el usuario del payload ya no existe', async () => {
      const { service } = construir({ usuario: null });

      await expect(
        service.resetPassword('token', 'Nueva1234', 'Nueva1234'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('guarda la contraseña en PLANO (la encripta UsuariosService)', async () => {
      const bcrypt = await import('bcrypt');
      const hashReal = await bcrypt.hash('Actual1234', 4);
      const usuariosService: MockUsuarios = {
        buscarPorEmail: jest.fn(),
        buscarPorId: jest.fn().mockResolvedValue({
          id: 7,
          email: 'u@u.cl',
          password_hash: hashReal,
        }),
        actualizar: jest.fn().mockResolvedValue({}),
      };
      const service = new AuthService(
        usuariosService as unknown as UsuariosService,
        {} as JwtService,
        {} as EmailService,
      );

      const res = await service.changePassword(7, 'Actual1234', 'NuevaPassword123', 'NuevaPassword123');

      expect(res.message).toBe('Contraseña cambiada correctamente');
      expect(usuariosService.actualizar).toHaveBeenCalledWith(7, {
        password_hash: 'NuevaPassword123',
      });
    });

    it('rechaza si la contraseña actual es incorrecta', async () => {
      const bcrypt = await import('bcrypt');
      const hashReal = await bcrypt.hash('Actual1234', 4);
      const usuariosService: MockUsuarios = {
        buscarPorEmail: jest.fn(),
        buscarPorId: jest.fn().mockResolvedValue({
          id: 7,
          email: 'u@u.cl',
          password_hash: hashReal,
        }),
        actualizar: jest.fn(),
      };
      const service = new AuthService(
        usuariosService as unknown as UsuariosService,
        {} as JwtService,
        {} as EmailService,
      );

      await expect(
        service.changePassword(7, 'Incorrecta99', 'Nueva1234', 'Nueva1234'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usuariosService.actualizar).not.toHaveBeenCalled();
    });
  });
});
