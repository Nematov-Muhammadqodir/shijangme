import { registerEnumType } from '@nestjs/graphql';

export enum BillStatus {
  ACTIVE = 'ACTIVE',
  DELETE = 'DELETE',
}
registerEnumType(BillStatus, {
  name: 'BillStatus',
});
