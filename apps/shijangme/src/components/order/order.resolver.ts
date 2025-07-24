import { forwardRef, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Order } from '../../libs/dto/order/order';
import {
  OrderItemInput,
  OrderItemsInput,
} from '../../libs/dto/order/order.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { OrderService } from './order.service';
console.log('Is OrderItemInput defined?', OrderItemInput);
@Resolver()
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  public async createOrder(
    @Args('input')
    input: OrderItemsInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Order> {
    console.log('Mutation createOrder');
    return await this.orderService.createOrder(memberId, input);
  }
}
