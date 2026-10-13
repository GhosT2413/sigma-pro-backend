import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService - contexto de creación (POST /usuarios vs registro)', () => {
  let service: UsuariosService;
  let repo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  const dtoBase = {
    nombre_completo: 'Persona X',
    email: 'persona@x.cl',
    password_hash: 'secreta123',
    hasAcceptedTerms: true,
  };

  beforeEach(() => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
    };
    service = new UsuariosService(repo as any, { buscarPorId: jest.fn() } as any);
  });

  it('registro público (sin contexto) no admite role 4 (ADMINISTRADOR)', async () => {
    await expect(
      service.crearUsuario({ ...dtoBase, role_id: 4 }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('un TALLER no puede crear roles distintos de 5/6', async () => {
    await expect(
      service.crearUsuario({ ...dtoBase, role_id: 1 }, { rol: 'TALLER', tallerId: 7 }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('un TALLER sin taller asociado no puede crear equipo', async () => {
    await expect(
      service.crearUsuario({ ...dtoBase, role_id: 5, taller_id: 99 }, { rol: 'TALLER', tallerId: null }),
    ).rejects.toThrow(BadRequestException);
  });

  it('un ADMINISTRADOR sí puede crear otro administrador (role 4)', async () => {
    const creado = await service.crearUsuario(
      { ...dtoBase, role_id: 4 },
      { rol: 'ADMINISTRADOR', tallerId: null },
    );
    expect(repo.save).toHaveBeenCalled();
    expect(creado.role).toEqual({ id: 4 });
  });

  it('un TALLER que crea role 5 recibe taller_id forzado al suyo, no al del body', async () => {
    const talleres = { buscarPorId: jest.fn().mockResolvedValue({ id: 7 }) };
    service = new UsuariosService(repo as any, talleres as any);

    await service.crearUsuario(
      { ...dtoBase, role_id: 5, taller_id: 999 },
      { rol: 'TALLER', tallerId: 7 },
    );

    expect(talleres.buscarPorId).toHaveBeenCalledWith(7);
    expect(repo.save).toHaveBeenCalled();
    const guardado = repo.save.mock.calls[0][0];
    expect(guardado.taller_id).toBe(7);
  });
});
