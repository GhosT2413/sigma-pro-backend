import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EmailService } from '../messaging/email.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: {} },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: EmailService, useValue: { sendPasswordResetEmail: jest.fn(), sendWelcomeEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});