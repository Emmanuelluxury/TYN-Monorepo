import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
