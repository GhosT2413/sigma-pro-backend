import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FichasService } from './fichas.service';
import { FichaMantencion } from './ficha-mantencion.entity';
import { VehiculosService } from '../vehiculos/vehiculos.service';

describe('FichasService', () => {
  let service: FichasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FichasService,
        { provide: getRepositoryToken(FichaMantencion), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), merge: jest.fn() } },
        { provide: VehiculosService, useValue: { actualizarKilometraje: jest.fn() } },
      ],
    }).compile();

    service = module.get<FichasService>(FichasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
