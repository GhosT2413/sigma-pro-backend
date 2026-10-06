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
      .addTag('usuarios', 'Gestión de usuarios')
      .addTag('vehiculos', 'Gestión de vehículos')
      .addTag('talleres', 'Gestión de talleres')
      .addTag('servicios', 'Gestión de servicios')
      .addTag('fichas', 'Fichas de mantenimiento')
      .addTag('alertas', 'Alertas de mantenimiento')
      .addTag('dashboard', 'Estadísticas y reportes')
      .addTag('clientes', 'Gestión de clientes')
      .addTag('predicciones', 'Predicciones IA')
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

  console.log(`🚀 SIGMAPRO API running on port ${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();