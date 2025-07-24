import { forwardRef, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Order, Orders } from '../../libs/dto/order/order';
import {
  OrderInquery,
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

  @UseGuards(AuthGuard)
  @Query(() => Orders)
  public async getMyOrders(
    @Args('input') input: OrderInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Orders> {
    console.log('Query getMyOrders');

    return await this.orderService.getMyOrders(memberId, input);
  }
}
