import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('QueueService');
  private running = false;

  constructor(private redisService: RedisService) {}

  // Start processing jobs when app starts
  onModuleInit() {
    this.running = true;
    this.processQueue('email-queue');
  }

  // Stop processing when app shuts down
  onModuleDestroy() {
    this.running = false;
  }

  // Worker loop — checks for jobs every 3 seconds
  private async processQueue(queue: string) {
    while (this.running) {
      const job = await this.redisService.dequeue(queue);

      if (job) {
        await this.handleJob(job);
      }

      // Wait 3 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Handle each job based on its type
  private async handleJob(job: any) {
    try {
      switch (job.type) {
        case 'PRODUCT_SOLD_EMAIL':
          this.logger.log(
            `Sending email to seller ${job.sellerId}: "${job.productName}" sold`,
          );
          // In the future: call a real email service here
          // await this.emailService.send(job.sellerEmail, subject, body);
          break;

        default:
          this.logger.warn(`Unknown job type: ${job.type}`);
      }
    } catch (err) {
      this.logger.error(`Job failed: ${job.type}`, err);
    }
  }
}
