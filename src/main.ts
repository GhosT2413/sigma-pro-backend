import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule, ObserveInstrument } from './app.module';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    bodyParser: false,
  });

  const configService = app.get(ConfigService);

  // Detrás del balanceador de carga (HAProxy) Express debe confiar en el proxy
  // para obtener la IP real del cliente (rate-limit y logs por cliente).
  if (configService.get('TRUST_PROXY', 'false') === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', true);
  }

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable for development, enable in production
  }));

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:4200'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With',
  });

  // Body parser with increased limits
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation (only in development)
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SIGMAPRO API')
      .setDescription('API para gestión de talleres mecánicos y mantenimiento vehicular')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticación y autorización')
      .addTag('roles', 'Roles del sistema')
      .addTag('usuarios', 'Gestión de usuarios')
      .addTag('vehiculos', 'Gestión de vehículos')
      .addTag('talleres', 'Gestión de talleres')
      .addTag('servicios', 'Gestión de servicios')
      .addTag('fichas', 'Fichas de mantenimiento')
      .addTag('alertas', 'Alertas de mantenimiento')
      .addTag('dashboard', 'Estadísticas y reportes')
      .addTag('clientes', 'Gestión de clientes')
      .addTag('predicciones', 'Predicciones IA')
      .addTag('health', 'Salud y topología de la infraestructura')
      .addTag('queue', 'Gestión de colas')
      .addTag('messaging', 'Mensajería y notificaciones')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get('PORT', 3003);
  await app.listen(port);

  console.log(`🚀 SIGMAPRO API [${configService.get('INSTANCE_ID', 'local')}] running on port ${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`❤️  Health check: http://localhost:${port}/api/health`);
}

bootstrap();
