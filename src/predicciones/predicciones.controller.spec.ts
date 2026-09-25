import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PrediccionesController } from './predicciones.controller';
import { PrediccionesService } from './predicciones.service';
import { PrediccionIa } from './prediccion-ia.entity';
import { AlertasService } from '../alertas/alertas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('PrediccionesController', () => {
  let controller: PrediccionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrediccionesController],
      providers: [
        { provide: PrediccionesService, useValue: {} },
        { provide: getRepositoryToken(PrediccionIa), useValue: {} },
        { provide: AlertasService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PrediccionesController>(PrediccionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
