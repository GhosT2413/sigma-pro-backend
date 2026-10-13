import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
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
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';
import { MessagingModule } from './messaging/messaging.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const base = {
          type: 'mysql' as const,
          port: Number(configService.get('DB_PORT', 3306)),
          username: configService.get('DB_USERNAME', 'root'),
          password: configService.get('DB_PASSWORD', 'root'),
          database: configService.get('DB_NAME', 'sigmapro_db'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('DB_SYNCHRONIZE', 'true') !== 'false',
          charset: 'utf8mb4',
          extra: { connectionLimit: 10 },
        };
        const masterHost = configService.get('DB_HOST', '127.0.0.1');
        const replicaHosts: string[] = String(configService.get('DB_REPLICA_HOSTS') ?? '')
          .split(',')
          .map((h: string) => h.trim())
          .filter(Boolean);

        // Sin réplicas (desarrollo local): configuración simple, igual que siempre.
        if (replicaHosts.length === 0) {
          return { ...base, host: masterHost };
        }

        // Escrituras -> primario, lecturas -> réplicas (TypeORM usa el pool de
        // "slaves" por defecto en las consultas SELECT: defaultReplicationModeForReads).
        return {
          ...base,
          replication: {
            master: { ...base, host: masterHost },
            slaves: replicaHosts.map((host: string) => ({ ...base, host })),
          },
        };
      },
      inject: [ConfigService],
    }),
    CommonModule,
    HealthModule,
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
  providers: [
    AppService,
    // Orden importa: primero autenticación global, luego autorización por rol.
    // Los endpoints marcados con @Public() (login, register, health...) saltan
    // el JwtAuthGuard; los marcados con @Roles(...) exigen rol específico.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly rolesService: RolesService) { }

  async onModuleInit() {
    // Semilla idempotente: con 2 réplicas del backend corriendo en paralelo,
    // una instancia puede perder la carrera de inserción (clave duplicada).
    try {
      await this.rolesService.seedRoles();
    } catch (error) {
      console.error('[AppModule] No fue posible sembrar los roles:', error);
    }
  }
}