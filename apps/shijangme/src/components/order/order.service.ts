import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Order, OrderItem } from '../../libs/dto/order/order';
import {
  OrderItemInput,
  OrderItemsInput,
} from '../../libs/dto/order/order.input';
import { Message } from '../../libs/enums/common.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
    @InjectModel('Order') private readonly orderModel: Model<Order>,
  ) {}

  public async createOrder(
    memberId: ObjectId,
    input: OrderItemsInput,
  ): Promise<Order> {
    const amount = input.ordertItemInputs.reduce(
      (acc: number, item: OrderItemInput) => {
        return acc + item.itemPrice * item.itemQuantity;
      },
      0,
    );

    const delivery = amount < 1000000 ? 5000 : 0;

    try {
      const orderInput = {
        orderTotal: amount + delivery,
        orderDelivery: delivery,
        memberId: memberId,
      };
      const newOrder = await this.orderModel.create(orderInput);
      const orderId = newOrder._id;

      await this.recordOrderItem(orderId, input.ordertItemInputs);

      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(Message.CREATE_FAILED);
    }
  }

  private async recordOrderItem(
    orderId: ObjectId,
    input: OrderItemInput[],
  ): Promise<void> {
    const promisedList = input.map(async (item: OrderItemInput) => {
      item.orderId = orderId;
      item.productId = shapeIntoMongoObjectId(item.productId);
      await this.orderItemModel.create(item);
      return 'Inserted';
    });
    const orderItemsState = await Promise.all(promisedList);
    console.log('orderItemsState', orderItemsState);
  }
}
