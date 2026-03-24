import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
  PRODUCT_SOLD = 'PRODUCT_SOLD',
  PRODUCT_LIKED = 'PRODUCT_LIKED',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});
