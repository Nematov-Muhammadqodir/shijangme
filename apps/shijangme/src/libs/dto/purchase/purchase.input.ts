import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';

@InputType()
export class PurchaseInput {
  @IsNotEmpty()
  @Field(() => String)
  purchaseDate: string;

  @IsNotEmpty()
  @Length(2, 100)
  @Field(() => String)
  productName: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productCollection?: string;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  quantity: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  unit?: string;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  unitCost?: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memo?: string;

  // Product creation fields (when vendor wants to list product for sale)
  @IsOptional()
  @Field(() => [String], { nullable: true })
  productImages?: string[];

  @IsOptional()
  @Field(() => Float, { nullable: true })
  productPrice?: number;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  productOriginPrice?: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productDesc?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productOrigin?: string;

  memberId?: ObjectId;
}

@InputType()
class PurchaseSearchInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  startDate?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  endDate?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productName?: string;
}

@InputType()
export class PurchasesInquiry {
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
  @Field(() => PurchaseSearchInput)
  search: PurchaseSearchInput;
}

@InputType()
export class PurchaseSummaryInput {
  @IsNotEmpty()
  @Field(() => String)
  startDate: string;

  @IsNotEmpty()
  @Field(() => String)
  endDate: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productName?: string;
}
