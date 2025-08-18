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
import { OrderUpdateInput } from '../../libs/dto/order/order.update';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
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
    if (input.ordertItemInputs.length < 1) throw new Error(Message.BAD_REQUEST);
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

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Orders)
  public async getAllOrdersByAdmin(
    @Args('input') input: OrderInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Orders> {
    console.log('Query getAllOrdersByAdmin');
    const result = await this.orderService.getAllOrdersByAdmin(input);
    console.log('getAllOrdersByAdminaaa resolver', result);
    return result;
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Order)
  public async updateOrderByAdmin(
    @Args('input') input: OrderUpdateInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Order> {
    console.log('Mutation updateOrderByAdmin');
    input.orderId = shapeIntoMongoObjectId(input.orderId);
    return await this.orderService.updateOrderByAdmin(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  public async updateOrder(
    @Args('input') input: OrderUpdateInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Order> {
    console.log('Mutation updateOrder');
    input.orderId = shapeIntoMongoObjectId(input.orderId);

    return await this.orderService.updateOrder(memberId, input);
  }
}
