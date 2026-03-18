import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ProductCollection } from '../../enums/product.enum';

@ObjectType()
export class PresetProduct {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  productName: string;

  @Field(() => String, { nullable: true })
  productCollection?: string;

  @Field(() => String)
  unit: string;

  @Field(() => Float)
  defaultUnitCost: number;

  @Field(() => Int)
  defaultQuantity: number;

  @Field(() => [String], { nullable: true })
  productImages?: string[];

  @Field(() => Float, { nullable: true })
  productPrice?: number;

  @Field(() => Float, { nullable: true })
  productOriginPrice?: number;

  @Field(() => String, { nullable: true })
  productDesc?: string;

  @Field(() => String, { nullable: true })
  productOrigin?: string;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
