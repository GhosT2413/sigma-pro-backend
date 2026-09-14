import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from './role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Role])], // <-- Registramos la entidad Role
  controllers: [RolesController],
  providers: [RolesService]
})
export class RolesModule { }
