import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class PresetProductInput {
  @IsNotEmpty()
  @Length(2, 100)
  @Field(() => String)
  productName: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productCollection?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  unit?: string;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  defaultUnitCost?: number;

  @IsOptional()
  @Field(() => Int, { nullable: true })
  defaultQuantity?: number;

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
export class PresetProductUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @IsOptional()
  @Length(2, 100)
  @Field(() => String, { nullable: true })
  productName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productCollection?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  unit?: string;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  defaultUnitCost?: number;

  @IsOptional()
  @Field(() => Int, { nullable: true })
  defaultQuantity?: number;

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

  @IsOptional()
  @Field(() => Int, { nullable: true })
  sortOrder?: number;
}
