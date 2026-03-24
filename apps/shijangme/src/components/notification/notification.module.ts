import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import NotificationSchema from '../../schemas/Notification.model';
import { NotificationService } from './notification.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
    ]),
    ChatModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
