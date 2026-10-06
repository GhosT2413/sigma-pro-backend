import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { EmailProcessor } from './processors/email.processor';
import { HeavyTaskProcessor } from './processors/heavy-task.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'heavy-tasks' },
      { name: 'notifications' },
    ),
  ],
  providers: [QueueService, EmailProcessor, HeavyTaskProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}