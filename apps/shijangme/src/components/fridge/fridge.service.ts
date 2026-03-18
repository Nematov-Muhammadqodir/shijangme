import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { FridgeItem, FridgeItems } from '../../libs/dto/fridge/fridge';
import {
  FridgeItemInput,
  FridgeItemUpdate,
  FridgeItemsInquiry,
  FridgeRestockInput,
} from '../../libs/dto/fridge/fridge.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { FridgeItemStatus } from '../../libs/enums/fridge.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class FridgeService {
  constructor(
    @InjectModel('FridgeItem')
    private readonly fridgeItemModel: Model<FridgeItem>,
  ) {}

  /** Add item to fridge. If same productName exists for this vendor, increment stock instead. */
  public async addFridgeItem(input: FridgeItemInput): Promise<FridgeItem> {
    try {
      const existing = await this.fridgeItemModel.findOne({
        memberId: input.memberId,
        productName: { $regex: new RegExp(`^${input.productName}$`, 'i') },
      });

      if (existing) {
        // Same product exists — merge: add stock
        const result = await this.fridgeItemModel.findByIdAndUpdate(
          existing._id,
          {
            $inc: { currentStock: input.currentStock },
            $set: {
              itemStatus: FridgeItemStatus.ACTIVE,
              ...(input.unit ? { unit: input.unit } : {}),
              ...(input.memo ? { memo: input.memo } : {}),
            },
          },
          { new: true },
        );
        return result;
      }

      // New product — create
      return await this.fridgeItemModel.create(input);
    } catch (error) {
      console.log('Error addFridgeItem:', error.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  /** Restock: vendor bought new stock of an existing product */
  public async restockFridgeItem(
    input: FridgeRestockInput,
  ): Promise<FridgeItem> {
    try {
      const existing = await this.fridgeItemModel.findOne({
        memberId: input.memberId,
        productName: { $regex: new RegExp(`^${input.productName}$`, 'i') },
      });

      if (existing) {
        return await this.fridgeItemModel.findByIdAndUpdate(
          existing._id,
          {
            $inc: { currentStock: input.amount },
            $set: { itemStatus: FridgeItemStatus.ACTIVE },
          },
          { new: true },
        );
      }

      // Doesn't exist yet — create as new
      return await this.fridgeItemModel.create({
        memberId: input.memberId,
        productName: input.productName,
        productCollection: input.productCollection,
        currentStock: input.amount,
        unit: input.unit ?? 'kg',
      });
    } catch (error) {
      console.log('Error restockFridgeItem:', error.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  /** Update fridge item (stock, status, memo) */
  public async updateFridgeItem(
    memberId: ObjectId,
    input: FridgeItemUpdate,
  ): Promise<FridgeItem> {
    const result = await this.fridgeItemModel.findOneAndUpdate(
      { _id: input._id, memberId },
      input,
      { new: true },
    );

    if (!result)
      throw new InternalServerErrorException(Message.UPDATE_FAILED);

    // Auto-set status to FINISHED if stock reaches 0
    if (result.currentStock <= 0 && result.itemStatus === FridgeItemStatus.ACTIVE) {
      result.itemStatus = FridgeItemStatus.FINISHED;
      result.currentStock = 0;
      await result.save();
    }

    return result;
  }

  /** Get vendor's fridge items with filters */
  public async getFridgeItems(
    memberId: ObjectId,
    input: FridgeItemsInquiry,
  ): Promise<FridgeItems> {
    const { itemStatus, productCollection, text } = input.search;

    const match: T = { memberId };

    if (itemStatus) {
      match.itemStatus = itemStatus;
    } else {
      match.itemStatus = { $ne: FridgeItemStatus.DELETE };
    }

    if (productCollection) {
      match.productCollection = productCollection;
    }

    if (text) {
      match.productName = { $regex: new RegExp(text, 'i') };
    }

    const sort: T = {
      [input.sort ?? 'updatedAt']: input?.direction ?? Direction.DESC,
    };

    const result = await this.fridgeItemModel.aggregate([
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

  /** Delete fridge item (soft delete) */
  public async deleteFridgeItem(
    memberId: ObjectId,
    fridgeItemId: ObjectId,
  ): Promise<FridgeItem> {
    const result = await this.fridgeItemModel.findOneAndUpdate(
      { _id: fridgeItemId, memberId },
      { itemStatus: FridgeItemStatus.DELETE },
      { new: true },
    );

    if (!result)
      throw new InternalServerErrorException(Message.REMOVE_FAILED);

    return result;
  }
}
