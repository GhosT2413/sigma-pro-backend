import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Taller } from './taller.entity';
import { TalleresService } from './talleres.service';
import { TalleresController } from './talleres.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Taller]), AuthModule],
  controllers: [TalleresController],
  providers: [TalleresService],
  exports: [TalleresService],
})
export class TalleresModule {}