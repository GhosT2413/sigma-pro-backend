import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FichasController } from './fichas.controller';
import { FichasService } from './fichas.service';
import { FichaMantencion } from './ficha-mantencion.entity';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('FichasController', () => {
  let controller: FichasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FichasController],
      providers: [
        { provide: FichasService, useValue: {} },
        { provide: getRepositoryToken(FichaMantencion), useValue: {} },
        { provide: VehiculosService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FichasController>(FichasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
