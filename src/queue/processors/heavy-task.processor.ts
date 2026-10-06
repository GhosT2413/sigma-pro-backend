import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('heavy-tasks')
export class HeavyTaskProcessor extends WorkerHost {
  private readonly logger = new Logger(HeavyTaskProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing heavy task: ${job.name} - Type: ${job.data.type}`);

    switch (job.data.type) {
      case 'report':
        return this.generateReport(job.data.payload);
      case 'import':
        return this.processImport(job.data.payload);
      case 'ai-processing':
        return this.processAI(job.data.payload);
      case 'file-processing':
        return this.processFile(job.data.payload);
      default:
        this.logger.warn(`Unknown heavy task type: ${job.data.type}`);
        return { success: false, error: 'Unknown task type' };
    }
  }

  private async generateReport(payload: Record<string, unknown>) {
    this.logger.log('Generating report...');
    // Simulate report generation
    await this.sleep(2000);
    return { success: true, reportId: `report-${Date.now()}` };
  }

  private async processImport(payload: Record<string, unknown>) {
    this.logger.log('Processing import...');
    // Simulate import processing
    await this.sleep(3000);
    return { success: true, importedCount: payload.count || 0 };
  }

  private async processAI(payload: Record<string, unknown>) {
    this.logger.log('Processing AI task...');
    // Simulate AI processing
    await this.sleep(5000);
    return { success: true, result: 'AI processing completed' };
  }

  private async processFile(payload: Record<string, unknown>) {
    this.logger.log('Processing file...');
    // Simulate file processing
    await this.sleep(1500);
    return { success: true, fileId: payload.fileId };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Heavy task job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error) {
    this.logger.error(`Heavy task job ${job?.id} failed: ${err.message}`);
  }
}