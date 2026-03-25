import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
  PRODUCT_SOLD = 'PRODUCT_SOLD',
  PRODUCT_LIKED = 'PRODUCT_LIKED',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  SUBSCRIBED = 'SUBSCRIBED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  SEND_MESSAGE = 'SEND_MESSAGE',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});
