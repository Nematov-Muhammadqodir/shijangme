import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { BillStatus } from '../../enums/bill.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class BillItem {
  @Field(() => String)
  productName: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  unit: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;
}

@ObjectType()
export class Bill {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  vendorName: string;

  @Field(() => String)
  customerName: string;

  @Field(() => [BillItem])
  items: BillItem[];

  @Field(() => Float)
  totalAmount: number;

  @Field(() => BillStatus)
  billStatus: BillStatus;

  @Field(() => String, { nullable: true })
  memo?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Bills {
  @Field(() => [Bill])
  list: Bill[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
