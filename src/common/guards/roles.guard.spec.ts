import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const contextoConUsuario = (user?: { role: string }): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('permite cuando el endpoint no define @Roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextoConUsuario({ role: 'CLIENTE' }))).toBe(true);
  });

  it('permite cuando el rol del usuario está en la lista', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRADOR', 'TALLER']);
    expect(guard.canActivate(contextoConUsuario({ role: 'TALLER' }))).toBe(true);
  });

  it('rechaza con 403 cuando el rol no está en la lista', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRADOR']);
    expect(() => guard.canActivate(contextoConUsuario({ role: 'CLIENTE' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rechaza cuando no hay usuario autenticado', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRADOR']);
    expect(() => guard.canActivate(contextoConUsuario(undefined))).toThrow(ForbiddenException);
  });
});
