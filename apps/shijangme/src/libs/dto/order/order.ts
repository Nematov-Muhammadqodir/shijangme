import { ObjectId } from 'mongoose';
import { OrderStatus } from '../../enums/order.enum';
import { IsNotEmpty, Min } from 'class-validator';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrderItem {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => Int)
  itemQuantity: number;

  @Field(() => Int)
  itemPrice: number;

  @Field(() => String)
  orderId: ObjectId;

  @Field(() => String)
  productId: ObjectId;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Order {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => Int)
  orderTotal: number;

  @Field(() => Int)
  orderDelivery: number;

  @Field(() => OrderStatus)
  orderStatus: OrderStatus;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
