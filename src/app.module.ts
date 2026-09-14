import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { PrediccionesModule } from './predicciones/predicciones.module';
import { ConfigModule } from '@nestjs/config';
import { AlertasModule } from './alertas/alertas.module';
import { FichasModule } from './fichas/fichas.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClientesModule } from './clientes/clientes.module';
import { ServiciosModule } from './servicios/servicios.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot(),
    // Aquí configuramos la conexión a tu base de datos 'sigmapro_db'
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306, // Puerto por defecto de MySQL
      username: 'root', // Tu usuario de MySQL
      password: 'root', // Pon aquí tu contraseña de MySQL
      database: 'sigmapro_db', // El nombre de la BD
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Activado temporalmente para sincronizar las columnas faltantes (ej: horas_trabajadas)
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
