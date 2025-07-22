import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ProductCollection, ProductStatus } from '../../enums/product.enum';

@InputType()
export class ProductUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @IsOptional()
  @Field(() => ProductStatus, { nullable: true })
  productStatus?: ProductStatus;

  @IsOptional()
  @Field(() => ProductCollection, { nullable: true })
  productCollection?: ProductCollection;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productName?: string;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  productPrice?: number;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  productOriginPrice?: number;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  productDiscountRate?: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productOrigin?: string;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  productLeftCount?: number;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  productVolume?: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productDesc?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  productImages?: string[];

  @IsOptional()
  @Field(() => Number, { nullable: true })
  productViews?: number;

  soldAt?: Date;

  deletedAt?: Date;
}
