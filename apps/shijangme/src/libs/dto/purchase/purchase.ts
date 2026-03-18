import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Purchase {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => Date)
  purchaseDate: Date;

  @Field(() => String)
  productName: string;

  @Field(() => String, { nullable: true })
  productCollection?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  unit: string;

  @Field(() => Float)
  unitCost: number;

  @Field(() => Float)
  totalCost: number;

  @Field(() => String, { nullable: true })
  memo?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Purchases {
  @Field(() => [Purchase])
  list: Purchase[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}

@ObjectType()
export class PurchaseSummaryItem {
  @Field(() => String)
  productName: string;

  @Field(() => Int)
  totalQuantity: number;

  @Field(() => String)
  unit: string;

  @Field(() => Float)
  totalCost: number;
}

@ObjectType()
export class PurchaseSummary {
  @Field(() => [PurchaseSummaryItem])
  items: PurchaseSummaryItem[];

  @Field(() => Float)
  grandTotal: number;
}
