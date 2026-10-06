import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../../messaging/email.service';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing email job: ${job.name}`);

    switch (job.name) {
      case 'send-email':
        return this.emailService.sendEmail(job.data);
      case 'send-templated-email':
        return this.emailService.sendTemplatedEmail(
          job.data.to,
          job.data.template,
          job.data.variables,
        );
      case 'send-password-reset':
        return this.emailService.sendPasswordResetEmail(job.data.email, job.data.token);
      case 'send-welcome':
        return this.emailService.sendWelcomeEmail(job.data.email, job.data.nombre);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return { success: false, error: 'Unknown job type' };
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Email job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error) {
    this.logger.error(`Email job ${job?.id} failed: ${err.message}`);
  }
}