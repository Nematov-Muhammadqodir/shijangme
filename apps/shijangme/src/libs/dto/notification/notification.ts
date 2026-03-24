import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { NotificationType } from '../../enums/notification.enum';

@ObjectType()
export class Notification {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => NotificationType)
  notificationType: NotificationType;

  @Field(() => String)
  notificationMessage: string;

  @Field(() => String)
  receiverId: ObjectId;

  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
