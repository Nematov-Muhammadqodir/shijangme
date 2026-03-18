import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { BorrowRequestStatus } from '../../enums/loan.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class BorrowRequest {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  requesterId: ObjectId;

  @Field(() => String)
  targetVendorId: ObjectId;

  @Field(() => String)
  productName: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  unit: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => BorrowRequestStatus)
  status: BorrowRequestStatus;

  @Field(() => String, { nullable: true })
  loanId?: ObjectId;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => Member, { nullable: true })
  requesterData?: Member;

  @Field(() => Member, { nullable: true })
  targetVendorData?: Member;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class BorrowRequests {
  @Field(() => [BorrowRequest])
  list: BorrowRequest[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
