import { ObjectId } from 'mongoose';
import { OrderStatus } from '../../enums/order.enum';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class OrderUpdateInput {
  @IsNotEmpty()
  @Field(() => String)
  orderId: ObjectId;

  @IsOptional()
  @Field(() => OrderStatus)
  orderStatus: OrderStatus;
}
