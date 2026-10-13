import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createConnection } from 'mysql2/promise';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

interface NodoDb {
  host: string | null;
  read_only: boolean;
  server_id?: number;
  estado?: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Health check usado por el balanceador de carga (HAProxy httpchk).
   * La lectura se hace en modo "slave" => demuestra que las lecturas
   * del sistema van a las réplicas de la base de datos.
   * Siempre responde 200 (aunque la BD esté caída) para no retirar
   * instancias sanas de la app del pool del LB.
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check de la instancia (usado por el balanceador)' })
  @ApiOkResponse({ description: 'Estado de la instancia y del nodo de BD que atendió la lectura' })
  async health() {
    const db = await this.leer('slave');
    return {
      status: 'ok',
      instance: this.instancia(),
      pid: process.pid,
      uptime_seconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      database: db,
    };
  }

  /**
   * Topología visible desde la app: primario + cada réplica.
   * Sirve para demostrar en vivo que existen 2 réplicas y que replican.
   */
  @Public()
  @Get('topology')
  @ApiOperation({ summary: 'Muestra primario y réplicas de la base de datos' })
  async topology() {
    const master = await this.leer('master');
    const hosts = this.replicaHosts();
    const replicas = await Promise.all(hosts.map((host) => this.inspeccionarReplica(host)));

    return {
      instance: this.instancia(),
      modo: hosts.length > 0 ? 'replicacion (escrituras=master, lecturas=slaves)' : 'simple',
      master,
      replicas,
    };
  }

  private instancia(): string {
    return (
      this.configService.get('INSTANCE_ID') ||
      process.env.HOSTNAME ||
      'local'
    );
  }

  private replicaHosts(): string[] {
    return String(this.configService.get('DB_REPLICA_HOSTS') ?? '')
      .split(',')
      .map((h: string) => h.trim())
      .filter(Boolean);
  }

  /** SELECT contra el pool que corresponde (master o slave de TypeORM). */
  private async leer(mode: 'master' | 'slave'): Promise<NodoDb> {
    const runner = this.dataSource.createQueryRunner(mode);
    try {
      const filas: Record<string, unknown>[] = await runner.query(
        'SELECT @@hostname AS host, @@read_only AS ro, @@server_id AS sid',
      );
      const fila = filas[0] ?? {};
      return {
        host: String(fila.host ?? ''),
        read_only: Number(fila.ro ?? 0) === 1,
        server_id: Number(fila.sid ?? 0),
        estado: mode,
      };
    } catch (error) {
      this.logger.warn(`Health: no se pudo leer en modo ${mode}: ${String(error)}`);
      return { host: null, read_only: false, estado: 'error' };
    } finally {
      await runner.release().catch(() => undefined);
    }
  }

  /** Conexión directa a una réplica para reportar su estado de replicación. */
  private async inspeccionarReplica(host: string): Promise<NodoDb & { io_running?: string; sql_running?: string; atraso_seg?: number }> {
    const base: NodoDb = { host, read_only: false, estado: 'down' };
    try {
      const conn = await createConnection({
        host,
        port: Number(this.configService.get('DB_PORT', 3306)),
        user: this.configService.get('DB_USERNAME', 'root'),
        password: this.configService.get('DB_PASSWORD', 'root'),
        database: this.configService.get('DB_NAME', 'sigmapro_db'),
        connectTimeout: 4000,
      });
      try {
        const [filas] = await conn.query(
          'SELECT @@hostname AS host, @@read_only AS ro, @@server_id AS sid',
        );
        const fila = (filas as Record<string, unknown>[])[0] ?? {};
        const resultado: NodoDb & {
          io_running?: string;
          sql_running?: string;
          atraso_seg?: number;
        } = {
          host: String(fila.host ?? host),
          read_only: Number(fila.ro ?? 0) === 1,
          server_id: Number(fila.sid ?? 0),
          estado: 'up',
        };
        try {
          const [repl] = await conn.query('SHOW REPLICA STATUS');
          const r = (repl as Record<string, unknown>[])[0] ?? {};
          resultado.io_running = String(r.Replica_IO_Running ?? 'Unknown');
          resultado.sql_running = String(r.Replica_SQL_Running ?? 'Unknown');
          resultado.atraso_seg = Number(r.Seconds_Behind_Source ?? -1);
        } catch {
          resultado.io_running = 'sin_privilegio';
          resultado.sql_running = 'sin_privilegio';
        }
        return resultado;
      } finally {
        await conn.end();
      }
    } catch (error) {
      this.logger.warn(`Réplica ${host} inaccesible: ${String(error)}`);
      return base;
    }
  }
}
