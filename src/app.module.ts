import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { PrediccionesModule } from './predicciones/predicciones.module';
import { AlertasModule } from './alertas/alertas.module';
import { FichasModule } from './fichas/fichas.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClientesModule } from './clientes/clientes.module';
import { ServiciosModule } from './servicios/servicios.module';
import { TalleresModule } from './talleres/talleres.module';
import { RolesService } from './roles/roles.service';
import { CommonModule } from './common/common.module';
import { QueueModule } from './queue/queue.module';
import { MessagingModule } from './messaging/messaging.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'sigmapro_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    CommonModule,
    QueueModule,
    MessagingModule,
    RolesModule,
    UsuariosModule,
    AuthModule,
    VehiculosModule,
    PrediccionesModule,
    AlertasModule,
    FichasModule,
    DashboardModule,
    ClientesModule,
    ServiciosModule,
    TalleresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly rolesService: RolesService) { }

  async onModuleInit() {
    await this.rolesService.seedRoles();
  }
}