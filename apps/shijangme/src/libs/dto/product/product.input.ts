import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ProductCollection, ProductVolume } from '../../enums/product.enum';
import { ObjectId } from 'mongoose';

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
  productLeftCount: number;

  @IsOptional()
  @Field(() => ProductVolume, { nullable: true })
  productVolume?: ProductVolume;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  productImages?: string[];

  @IsOptional()
  @Length(5, 500)
  @Field(() => String, { nullable: true })
  productDesc?: string;

  productOwnerId?: ObjectId;
}
