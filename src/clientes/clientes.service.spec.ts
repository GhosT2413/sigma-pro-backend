import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { Cliente } from './cliente.entity';
import { UsuariosService } from '../usuarios/usuarios.service';

describe('ClientesService', () => {
  let service: ClientesService;
  let repo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock; create: jest.Mock; remove: jest.Mock; merge: jest.Mock };
  let usuarios: { buscarPorId: jest.Mock };

  beforeEach(async () => {
    repo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), remove: jest.fn(), merge: jest.fn() };
    usuarios = { buscarPorId: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: getRepositoryToken(Cliente), useValue: repo },
        { provide: UsuariosService, useValue: usuarios },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crearCliente', () => {
    const dto = { nombre_completo: 'Ana Pérez', rut: '12.345.678-5', email: 'ana@ejemplo.cl' };
    const yo = { userId: 99, email: 'ana@ejemplo.cl', role: 'CLIENTE' };

    it('devuelve el registro existente (sin error) cuando el RUT es del mismo cliente', async () => {
      const existente = { id: 7, usuario_id: null, nombre_completo: 'Ana Pérez', rut: '12345678-5', email: 'ana@ejemplo.cl' } as Cliente;
      repo.findOne.mockResolvedValue(existente);

      const res = await service.crearCliente(dto, yo);

      expect(res.cliente.id).toBe(7);
      expect(repo.create).not.toHaveBeenCalled();
      expect(res.mensaje).toBe('El cliente ya existe.');
    });

    it('reconoce al mismo cliente por RUT cuando el perfil existente no tiene email ni usuario_id', async () => {
      const existente = { id: 3, usuario_id: null, nombre_completo: 'Ana Pérez', rut: '12345678-5', email: null } as any as Cliente;
      repo.findOne.mockResolvedValue(existente);
      usuarios.buscarPorId.mockResolvedValue({ id: 99, rut: '12345678-5' });

      const res = await service.crearCliente(dto, yo);

      expect(res.cliente.id).toBe(3);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rechaza el RUT cuando pertenece a otro cliente', async () => {
      repo.findOne.mockResolvedValue({ id: 8, usuario_id: 5, email: 'otro@ejemplo.cl', rut: '12345678-5' } as Cliente);
      usuarios.buscarPorId.mockResolvedValue({ id: 99, rut: '11111111-1' });

      await expect(service.crearCliente(dto, yo)).rejects.toThrow(
        new BadRequestException('El RUT ingresado ya está registrado a otro cliente.'),
      );
    });

    it('liga el nuevo cliente al usuario autenticado cuando el rol es CLIENTE', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((data) => data);
      repo.save.mockImplementation(async (entity) => ({ ...entity, id: 1 }));

      await service.crearCliente(dto, yo);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ usuario_id: 99, rut: '12345678-5' }));
    });

    it('permite vincular otro usuario solo si el rol no es CLIENTE', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((data) => data);
      repo.save.mockImplementation(async (entity) => ({ ...entity, id: 1 }));

      await service.crearCliente({ ...dto, usuario_id: 42 }, { userId: 1, email: 'admin@ejemplo.cl', role: 'ADMIN' });

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ usuario_id: 42 }));
    });
  });
});
