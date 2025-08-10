import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import {
  ProductCollection,
  ProductFrom,
  ProductStatus,
  ProductVolume,
} from '../../enums/product.enum';
import { ObjectId } from 'mongoose';
import { availableProducts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ProductInput {
  @IsNotEmpty()
  @Field(() => ProductCollection)
  productCollection: ProductCollection;

  @IsNotEmpty()
  @Length(3, 100)
  @Field(() => String)
  productName: string;

  @IsNotEmpty()
  @Field(() => Number)
  productPrice: number;

  @IsNotEmpty()
  @Field(() => Number)
  productOriginPrice: number;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  productDiscountRate?: {
    type: Number;
  };

  @IsOptional()
  @Field(() => String, { nullable: true })
  productOrigin?: string;

  @IsNotEmpty()
  @Field(() => Number)
  productLeftCount: number;

  @IsOptional()
  @Field(() => Number, { nullable: true })
  productVolume?: number;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  productImages?: string[];

  @IsOptional()
  @Length(5, 500)
  @Field(() => String, { nullable: true })
  productDesc?: string;

  productOwnerId?: ObjectId;
}

@InputType()
export class PISearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  productOwnerId?: ObjectId;

  @IsOptional()
  @Field(() => [ProductCollection], { nullable: true })
  productCollection?: ProductCollection[];

  @IsOptional()
  @Field(() => [ProductVolume], { nullable: true })
  productVolume?: [ProductVolume];

  @Field(() => Int, { nullable: true })
  productDiscountRate?: number;

  @Field(() => [ProductFrom], { nullable: true })
  productOrigin?: ProductFrom[];

  @IsOptional()
  @Field(() => [String], { nullable: true })
  text?: string;
}

@InputType()
export class ProductsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  // @IsIn(availableProducts)
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => PISearch)
  search: PISearch;
}

@InputType()
export class OrdinaryInquery {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;
}

@InputType()
export class VPISearch {
  @IsOptional()
  @Field(() => ProductStatus, { nullable: true })
  productStatus?: ProductStatus;
}

@InputType()
export class VendorProductsInquery {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @IsIn(availableProducts)
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => VPISearch)
  search: VPISearch;
}

@InputType()
class ALPISearch {
  @IsOptional()
  @Field(() => ProductStatus, { nullable: true })
  productStatus?: ProductStatus;
  //* Bu orqali biz harqanday turdagi Propertilarni olish imkoni bermoqdamiz ==> DELETE => ACTIVE => SOLD

  @IsOptional()
  @Field(() => [ProductFrom], { nullable: true })
  productFromList?: ProductFrom[];
}

@InputType()
export class AllProductsInquery {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @IsIn(availableProducts)
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => ALPISearch)
  search: ALPISearch;
}
