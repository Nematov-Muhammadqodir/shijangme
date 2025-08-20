import { registerEnumType } from '@nestjs/graphql';

export enum NoticeCategory {
  FAQ = 'FAQ',
  TERMS = 'TERMS',
  INQUIRY = 'INQUIRY',
}
registerEnumType(NoticeCategory, {
  name: 'NoticeCategory',
});

export enum NoticeStatus {
  HOLD = 'HOLD',
  ACTIVE = 'ACTIVE',
  DELETE = 'DELETE',
}
registerEnumType(NoticeStatus, {
  name: 'NoticeStatus',
});

export enum NoticeFor {
  PRODUCT = 'PRODUCT',
  PAYMENT = 'PAYMENT',
  FOR_BUYERS = 'FOR_BUYERS',
  COMMUNITY = 'COMMUNITY',
  OTHER = 'OTHER',
}

registerEnumType(NoticeFor, {
  name: 'NoticeFor',
});
