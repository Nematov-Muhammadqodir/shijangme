import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Order, OrderItem, Orders } from '../../libs/dto/order/order';
import {
  OrderInquery,
  OrderItemInput,
  OrderItemsInput,
} from '../../libs/dto/order/order.input';
import { Message } from '../../libs/enums/common.enum';
import {
  lookupOrderItemProducts,
  lookupOrderItems,
  shapeIntoMongoObjectId,
} from '../../libs/config';
import { T } from '../../libs/types/common';
import { OrderUpdateInput } from '../../libs/dto/order/order.update';
import { OrderStatus } from '../../libs/enums/order.enum';
import { MemberService } from '../member/member.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    private readonly memberService: MemberService,
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

    const delivery = 0;

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

  public async getMyOrders(
    memberId: ObjectId,
    inquery: OrderInquery,
  ): Promise<Orders> {
    const { page, limit } = inquery;
    const { orderStatus } = inquery.search;

    const match: T = { orderStatus: orderStatus, memberId: memberId };

    const result = await this.orderModel
      .aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupOrderItems(),
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async getAllOrdersByAdmin(inquery: OrderInquery): Promise<Orders> {
    const { page, limit } = inquery;
    const { orderStatus } = inquery.search;
    const match: T = {};

    if (orderStatus) match.orderStatus = orderStatus;

    const result = await this.orderModel
      .aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupOrderItems(),
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();
    console.log('getAllOrdersByAdminaaa', result[0]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async getAllOrderItemsByAdmin(
    orderId: ObjectId,
  ): Promise<OrderItem[]> {
    console.log('Service getAllOrderItemsByAdmin');
    const search: T = {
      _id: orderId,
    };

    const result = await this.orderItemModel.find({ orderId: orderId });
    console.log('result Service', result);
    return result;
  }

  public async updateOrderByAdmin(
    memberId: ObjectId,
    input: OrderUpdateInput,
  ): Promise<Order> {
    const isProcessed = await this.orderModel
      .findOne({
        _id: input.orderId,
        orderStatus: OrderStatus.PROCESS,
      })
      .exec();
    const result = await this.orderModel
      .findOneAndUpdate(
        {
          _id: input.orderId,
        },
        { orderStatus: input.orderStatus },
        { new: true },
      )
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (!isProcessed) {
      if (input.orderStatus === OrderStatus.PROCESS)
        this.memberService.memberStatsEditor({
          _id: memberId,
          targetKey: 'memberPoints',
          modifier: 1,
        });
    }

    return result;
  }

  public async updateOrder(
    memberId: ObjectId,
    input: OrderUpdateInput,
  ): Promise<Order> {
    const isProcessed = await this.orderModel
      .findOne({
        memberId: memberId,
        _id: input.orderId,
        orderStatus: OrderStatus.PROCESS,
      })
      .exec();
    const result = await this.orderModel
      .findOneAndUpdate(
        {
          memberId: memberId,
          _id: input.orderId,
        },
        { orderStatus: input.orderStatus },
        { new: true },
      )
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (!isProcessed) {
      if (input.orderStatus === OrderStatus.PROCESS)
        this.memberService.memberStatsEditor({
          _id: memberId,
          targetKey: 'memberPoints',
          modifier: 1,
        });
    }

    return result;
  }
}
