import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import {
  NoticeCategory,
  NoticeFor,
  NoticeStatus,
} from '../../enums/notice.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class NoticeInput {
  @IsNotEmpty()
  @Field(() => NoticeCategory)
  noticeCategory: NoticeCategory;

  @IsNotEmpty()
  @Field(() => NoticeStatus)
  noticeStatus: NoticeStatus;

  @IsNotEmpty()
  @Length(3, 50)
  @Field(() => String)
  noticeTitle: string;

  @IsOptional()
  @Field(() => NoticeFor, { nullable: true })
  noticeFor?: NoticeFor;

  @IsNotEmpty()
  @Length(3, 250)
  @Field(() => String)
  noticeContent: string;

  memberId?: ObjectId;
}

@InputType()
export class NoticeInquery {
  @IsNotEmpty()
  @Field(() => NoticeFor)
  noticeFor: NoticeFor;
}
