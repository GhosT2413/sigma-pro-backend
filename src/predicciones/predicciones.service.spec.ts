import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PrediccionesService } from './predicciones.service';
import { PrediccionIa } from './prediccion-ia.entity';
import { AlertasService } from '../alertas/alertas.service';

describe('PrediccionesService', () => {
  let service: PrediccionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrediccionesService,
        { provide: getRepositoryToken(PrediccionIa), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() } },
        { provide: AlertasService, useValue: { evaluarUmbral: jest.fn() } },
      ],
    }).compile();

    service = module.get<PrediccionesService>(PrediccionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
