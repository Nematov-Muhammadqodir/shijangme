import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, Length } from 'class-validator';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class NoticeInput {
  @IsNotEmpty()
  @Field(() => NoticeCategory)
  noticeCategory: NoticeCategory;

  @IsNotEmpty()
  @Field(() => NoticeStatus)
  noticeStatus?: NoticeStatus;

  @IsNotEmpty()
  @Length(3, 50)
  @Field(() => String)
  noticeTitle: string;

  @IsNotEmpty()
  @Length(3, 250)
  @Field(() => String)
  noticeContent: string;

  memberId?: ObjectId;
}
