import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Bill, Bills } from '../../libs/dto/bill/bill';
import { BillInput, BillsInquiry } from '../../libs/dto/bill/bill.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BillStatus } from '../../libs/enums/bill.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class BillService {
  constructor(
    @InjectModel('Bill') private readonly billModel: Model<Bill>,
  ) {}

  public async createBill(input: BillInput): Promise<Bill> {
    try {
      return await this.billModel.create(input);
    } catch (error) {
      console.log('Error createBill:', error.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getBills(
    memberId: ObjectId,
    input: BillsInquiry,
  ): Promise<Bills> {
    const { billStatus, customerName, startDate, endDate } = input.search;

    const match: T = { memberId };

    if (billStatus) {
      match.billStatus = billStatus;
    } else {
      match.billStatus = { $ne: BillStatus.DELETE };
    }

    if (customerName) {
      match.customerName = { $regex: new RegExp(customerName, 'i') };
    }

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const sort: T = {
      [input.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
    };

    const result = await this.billModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async getBill(
    memberId: ObjectId,
    billId: ObjectId,
  ): Promise<Bill> {
    const result = await this.billModel
      .findOne({ _id: billId, memberId })
      .lean()
      .exec();

    if (!result)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result as unknown as Bill;
  }

  public async deleteBill(
    memberId: ObjectId,
    billId: ObjectId,
  ): Promise<Bill> {
    const result = await this.billModel.findOneAndUpdate(
      { _id: billId, memberId },
      { billStatus: BillStatus.DELETE },
      { new: true },
    );

    if (!result)
      throw new InternalServerErrorException(Message.REMOVE_FAILED);

    return result;
  }
}
