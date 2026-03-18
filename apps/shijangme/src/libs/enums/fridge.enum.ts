import { registerEnumType } from '@nestjs/graphql';

export enum FridgeItemStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
  DELETE = 'DELETE',
}
registerEnumType(FridgeItemStatus, {
  name: 'FridgeItemStatus',
});
