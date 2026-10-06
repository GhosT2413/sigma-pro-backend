import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue, QueueEvents, Worker } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface HeavyTaskJobData {
  type: 'report' | 'import' | 'ai-processing' | 'file-processing';
  payload: Record<string, unknown>;
  userId?: number;
}

export interface NotificationJobData {
  userId: number;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly redisConnection: { host: string; port: number; password?: string };

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('heavy-tasks') private readonly heavyTaskQueue: Queue,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.redisConnection = {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD') || undefined,
    };
  }

  async onModuleInit() {
    this.setupQueueEvents();
  }

  private setupQueueEvents() {
    const queues = [
      { name: 'email' },
      { name: 'heavy-tasks' },
      { name: 'notifications' },
    ];

    queues.forEach(({ name }) => {
      const queueEvents = new QueueEvents(name, {
        connection: this.redisConnection,
      });

      queueEvents.on('completed', ({ jobId }) => {
        console.log(`[Queue:${name}] Job ${jobId} completed`);
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`[Queue:${name}] Job ${jobId} failed: ${failedReason}`);
      });
    });
  }

  async sendEmail(data: EmailJobData): Promise<void> {
    await this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async sendTemplatedEmail(
    to: string,
    template: string,
    variables: Record<string, string>,
  ): Promise<void> {
    await this.emailQueue.add('send-templated-email', { to, template, variables }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addHeavyTask(data: HeavyTaskJobData): Promise<void> {
    await this.heavyTaskQueue.add('process-heavy-task', data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 25,
    });
  }

  async sendNotification(data: NotificationJobData): Promise<void> {
    await this.notificationQueue.add('send-notification', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 200,
      removeOnFail: 100,
    });
  }

  async getEmailQueueStats() {
    return {
      waiting: await this.emailQueue.getWaitingCount(),
      active: await this.emailQueue.getActiveCount(),
      completed: await this.emailQueue.getCompletedCount(),
      failed: await this.emailQueue.getFailedCount(),
    };
  }

  async getHeavyTaskQueueStats() {
    return {
      waiting: await this.heavyTaskQueue.getWaitingCount(),
      active: await this.heavyTaskQueue.getActiveCount(),
      completed: await this.heavyTaskQueue.getCompletedCount(),
      failed: await this.heavyTaskQueue.getFailedCount(),
    };
  }
}