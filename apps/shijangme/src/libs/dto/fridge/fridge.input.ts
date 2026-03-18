import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ProductCollection } from '../../enums/product.enum';
import { FridgeItemStatus } from '../../enums/fridge.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class FridgeItemInput {
  @IsNotEmpty()
  @Length(2, 100)
  @Field(() => String)
  productName: string;

  @IsNotEmpty()
  @Field(() => ProductCollection)
  productCollection: ProductCollection;

  @IsNotEmpty()
  @Min(0)
  @Field(() => Int)
  currentStock: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  unit?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memo?: string;

  memberId?: ObjectId;
}

@InputType()
export class FridgeItemUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  currentStock?: number;

  @IsOptional()
  @Field(() => FridgeItemStatus, { nullable: true })
  itemStatus?: FridgeItemStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  unit?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memo?: string;
}

/** Used when vendor buys new stock of an existing product */
@InputType()
export class FridgeRestockInput {
  @IsNotEmpty()
  @Length(2, 100)
  @Field(() => String)
  productName: string;

  @IsNotEmpty()
  @Field(() => ProductCollection)
  productCollection: ProductCollection;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  amount: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  unit?: string;

  memberId?: ObjectId;
}

@InputType()
class FridgeSearchInput {
  @IsOptional()
  @Field(() => FridgeItemStatus, { nullable: true })
  itemStatus?: FridgeItemStatus;

  @IsOptional()
  @Field(() => ProductCollection, { nullable: true })
  productCollection?: ProductCollection;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class FridgeItemsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => FridgeSearchInput)
  search: FridgeSearchInput;
}
