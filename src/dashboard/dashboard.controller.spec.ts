import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { AlertaMantencion } from '../alertas/alerta-mantencion.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: {} },
        { provide: getRepositoryToken(Vehiculo), useValue: {} },
        { provide: getRepositoryToken(AlertaMantencion), useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
