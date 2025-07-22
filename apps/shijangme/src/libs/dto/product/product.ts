import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ProductCollection, ProductStatus } from '../../enums/product.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Product {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => ProductCollection)
  productCollection: ProductCollection;

  @Field(() => ProductStatus)
  productStatus: ProductStatus;

  @Field(() => String)
  productName: string;

  @Field(() => Number)
  productPrice: string;

  @Field(() => Int)
  productViews: number;

  @Field(() => Int)
  productLikes: number;

  @Field(() => Int)
  productComments: number;

  @Field(() => Int)
  productRank: number;

  @Field(() => [String])
  productImages: string[];

  @Field(() => String, { nullable: true })
  productDesc?: string;

  @Field(() => String)
  productOwnerId: ObjectId;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  // from aggregation

  @Field(() => Member, { nullable: true })
  memberData?: Member;
  //================

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
  accessToken: any;

  // From Aggregation

  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];
}

@ObjectType()
export class Products {
  @Field(() => [Product])
  list: Product[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
