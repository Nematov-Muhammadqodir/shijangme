import { ObjectId } from 'mongoose';
import { OrderStatus } from '../../enums/order.enum';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class OrderItemInput {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  itemQuantity: number;

  @IsNotEmpty()
  @Field(() => Int)
  itemPrice: number;

  @IsNotEmpty()
  @Field(() => String)
  productId: string;

  orderId?: ObjectId;
}

@InputType()
export class OrderItemsInput {
  @IsNotEmpty()
  @Field(() => [OrderItemInput])
  ordertItemInputs: OrderItemInput[];
}

@InputType()
export class OISearch {
  @IsOptional()
  @Field(() => OrderStatus, { nullable: true })
  orderStatus?: OrderStatus;
}

@InputType()
export class OrderInquery {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsNotEmpty()
  @Field(() => OISearch)
  search: OISearch;
}
