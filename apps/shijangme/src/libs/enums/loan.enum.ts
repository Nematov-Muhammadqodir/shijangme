import { registerEnumType } from '@nestjs/graphql';

export enum BorrowRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
registerEnumType(BorrowRequestStatus, {
  name: 'BorrowRequestStatus',
});

export enum LoanStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}
registerEnumType(LoanStatus, {
  name: 'LoanStatus',
});
