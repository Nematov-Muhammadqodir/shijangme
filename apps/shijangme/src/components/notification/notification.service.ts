import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../../libs/dto/notification/notification';
import { NotificationType } from '../../libs/enums/notification.enum';
import { RedisService } from '../redis/redis.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class NotificationService implements OnModuleInit {
  private logger = new Logger('NotificationService');

  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<Notification>,
    private redisService: RedisService,
    private chatGateway: ChatGateway,
  ) {}

  // Subscribe to product events when app starts
  async onModuleInit() {
    await this.redisService.subscribe('product-events', async (data) => {
      if (data.event === NotificationType.PRODUCT_SOLD) {
        // 1. Save notification to database
        const notification = await this.createNotification({
          notificationType: NotificationType.PRODUCT_SOLD,
          notificationMessage: `Your product "${data.productName}" has been sold!`,
          receiverId: data.sellerId,
        });

        // 2. Send real-time notification to seller's browser via Socket.io
        this.chatGateway.sendNotification(
          data.sellerId,
          'notification',
          notification,
        );

        this.logger.log(
          `Notification sent to seller ${data.sellerId}: ${data.productName} sold`,
        );
      } else if (data.event === NotificationType.PRODUCT_DELETED) {
        // 1. Save notification to database
        const notification = await this.createNotification({
          notificationType: NotificationType.PRODUCT_DELETED,
          notificationMessage: `Your product "${data.productName}" has been deleted!`,
          receiverId: data.sellerId,
        });

        // 2. Send real-time notification to seller's browser via Socket.io
        this.chatGateway.sendNotification(
          data.sellerId,
          'notification',
          notification,
        );

        this.logger.log(
          `Notification sent to seller ${data.sellerId}: ${data.productName} deleted`,
        );
      }
    });

    await this.redisService.subscribe('follow-events', async (data) => {
      if (data.event === NotificationType.SUBSCRIBED) {
        // 1. Save notification to database
        const notification = await this.createNotification({
          notificationType: NotificationType.SUBSCRIBED,
          notificationMessage: `${data.followerName} followed you`,
          receiverId: data.followingId,
        });

        // 2. Send real-time notification to seller's browser via Socket.io
        this.chatGateway.sendNotification(
          data.followingId,
          'notification',
          notification,
        );

        this.logger.log(
          `Notification sent to user ${data.followingId}: ${data.followerName} is new follower`,
        );
      }
    });
  }

  // Save notification to database
  async createNotification(input: {
    notificationType: NotificationType;
    notificationMessage: string;
    receiverId: any;
  }): Promise<Notification> {
    return await this.notificationModel.create(input);
  }
}
