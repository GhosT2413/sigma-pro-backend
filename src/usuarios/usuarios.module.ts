import { Module, forwardRef } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuarios.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]), // <-- Registramos la entidad Usuario
    forwardRef(() => AuthModule),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService], // No incluir JwtAuthGuard aquí
  exports: [UsuariosService], // <-- Exportamos el servicio para que AuthModule pueda usarlo
})
export class UsuariosModule { }
