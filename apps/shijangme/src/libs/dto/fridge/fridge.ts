import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ProductCollection } from '../../enums/product.enum';
import { FridgeItemStatus } from '../../enums/fridge.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class FridgeItem {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  productName: string;

  @Field(() => ProductCollection)
  productCollection: ProductCollection;

  @Field(() => FridgeItemStatus)
  itemStatus: FridgeItemStatus;

  @Field(() => Int)
  currentStock: number;

  @Field(() => String)
  unit: string;

  @Field(() => String, { nullable: true })
  memo?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class FridgeItems {
  @Field(() => [FridgeItem])
  list: FridgeItem[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
