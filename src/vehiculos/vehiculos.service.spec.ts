import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { Vehiculo, TipoUso } from './vehiculo.entity';
import { Cliente } from '../clientes/cliente.entity';

describe('VehiculosService', () => {
  let service: VehiculosService;
  let vehiculosRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
    merge: jest.Mock;
  };
  let clientesRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    vehiculosRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      merge: jest.fn(),
    };
    clientesRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiculosService,
        { provide: getRepositoryToken(Vehiculo), useValue: vehiculosRepo },
        { provide: getRepositoryToken(Cliente), useValue: clientesRepo },
      ],
    }).compile();

    service = module.get<VehiculosService>(VehiculosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('actualizar', () => {
    const vehiculoExistente = () => ({
      id: 1,
      patente: 'AA1111',
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2020,
      tipo_uso: TipoUso.DIARIO,
      cliente: { id: 7, usuario_id: 99 },
    });

    const clienteUsuario = { userId: 99, email: 'cliente@ejemplo.cl', role: 'CLIENTE' };
    const adminUsuario = { userId: 1, email: 'admin@ejemplo.cl', role: 'ADMINISTRADOR' };

    it('ignora patente, marca, modelo y año cuando el editor es CLIENTE', async () => {
      vehiculosRepo.findOne.mockResolvedValue(vehiculoExistente());
      vehiculosRepo.save.mockImplementation((v) => Promise.resolve(v));

      await service.actualizar(
        1,
        { patente: 'BB2222', marca: 'Ford', modelo: 'Focus', anio: 2022, tipo_uso: TipoUso.CARRERA },
        clienteUsuario,
      );

      // Solo se buscó el vehículo por id: no se llegó a validar unicidad de patente.
      expect(vehiculosRepo.findOne).toHaveBeenCalledTimes(1);
      // El merge recibe únicamente los campos que el Cliente sí puede editar.
      expect(vehiculosRepo.merge).toHaveBeenCalledWith(expect.anything(), { tipo_uso: TipoUso.CARRERA });
    });

    it('permite al ADMINISTRADOR cambiar la patente y el resto de la identidad', async () => {
      vehiculosRepo.findOne.mockResolvedValue(vehiculoExistente());
      vehiculosRepo.save.mockImplementation((v) => Promise.resolve(v));

      await service.actualizar(
        1,
        { patente: 'BB2222', marca: 'Ford', modelo: 'Focus', anio: 2022 },
        adminUsuario,
      );

      expect(vehiculosRepo.merge).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ patente: 'BB2222', marca: 'Ford', modelo: 'Focus', anio: 2022 }),
      );
    });

    it('sigue validando la propiedad del vehículo para CLIENTE', async () => {
      vehiculosRepo.findOne.mockResolvedValue({ ...vehiculoExistente(), cliente: { id: 7, usuario_id: 123 } });

      await expect(
        service.actualizar(1, { marca: 'Ford' }, clienteUsuario),
      ).rejects.toThrow('Este vehículo no te pertenece.');
      expect(vehiculosRepo.merge).not.toHaveBeenCalled();
    });
  });
});
