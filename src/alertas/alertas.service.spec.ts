import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlertasService } from './alertas.service';
import { AlertaMantencion } from './alerta-mantencion.entity';

describe('AlertasService', () => {
  let service: AlertasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertasService,
        { provide: getRepositoryToken(AlertaMantencion), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() } },
      ],
    }).compile();

    service = module.get<AlertasService>(AlertasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
