import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Purchase, Purchases, PurchaseSummary } from '../../libs/dto/purchase/purchase';
import {
  PurchaseInput,
  PurchasesInquiry,
  PurchaseSummaryInput,
} from '../../libs/dto/purchase/purchase.input';
import { Product } from '../../libs/dto/product/product';
import { PresetProduct } from '../../libs/dto/preset-product/preset-product';
import { FridgeItem } from '../../libs/dto/fridge/fridge';
import { FridgeItemStatus } from '../../libs/enums/fridge.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { T } from '../../libs/types/common';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel('Purchase') private readonly purchaseModel: Model<Purchase>,
    @InjectModel('FridgeItem') private readonly fridgeItemModel: Model<FridgeItem>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('PresetProduct') private readonly presetModel: Model<PresetProduct>,
    private readonly memberService: MemberService,
  ) {}

  /**
   * Record a purchase AND auto-update refrigerator stock.
   * Also creates/updates a Product for the marketplace if price info is provided.
   */
  public async createPurchase(input: PurchaseInput): Promise<Purchase> {
    try {
      // 1. Calculate totalCost
      const totalCost = (input.unitCost ?? 0) * input.quantity;

      // 2. Create immutable purchase record
      const purchase = await this.purchaseModel.create({
        ...input,
        purchaseDate: new Date(input.purchaseDate),
        totalCost,
      });

      // 3. Auto-update refrigerator stock (upsert)
      await this.fridgeItemModel.findOneAndUpdate(
        {
          memberId: input.memberId,
          productName: { $regex: new RegExp(`^${input.productName}$`, 'i') },
        },
        {
          $inc: { currentStock: input.quantity },
          $set: {
            itemStatus: FridgeItemStatus.ACTIVE,
            ...(input.unit ? { unit: input.unit } : {}),
            ...(input.productCollection
              ? { productCollection: input.productCollection }
              : {}),
          },
          $setOnInsert: {
            memberId: input.memberId,
            productName: input.productName,
          },
        },
        { upsert: true, new: true },
      );

      // 4. Create/update Product for marketplace if sell price is provided
      if (input.productPrice && input.productCollection) {
        const existingProduct = await this.productModel.findOne({
          productOwnerId: input.memberId,
          productName: { $regex: new RegExp(`^${input.productName}$`, 'i') },
          productStatus: ProductStatus.ACTIVE,
        });

        if (existingProduct) {
          // Update existing product stock & price
          await this.productModel.findByIdAndUpdate(existingProduct._id, {
            $inc: { productLeftCount: input.quantity },
            $set: {
              productPrice: input.productPrice,
              ...(input.productOriginPrice
                ? { productOriginPrice: input.productOriginPrice }
                : {}),
              ...(input.productImages?.length
                ? { productImages: input.productImages }
                : {}),
              ...(input.productDesc
                ? { productDesc: input.productDesc }
                : {}),
              ...(input.productOrigin
                ? { productOrigin: input.productOrigin }
                : {}),
            },
          });
        } else {
          // Create new product
          const newProduct = await this.productModel.create({
            productOwnerId: input.memberId,
            productName: input.productName,
            productCollection: input.productCollection,
            productPrice: input.productPrice,
            productOriginPrice: input.productOriginPrice ?? input.productPrice,
            productLeftCount: input.quantity,
            productImages: input.productImages ?? [],
            productDesc: input.productDesc ?? '',
            productOrigin: input.productOrigin ?? '',
            productStatus: ProductStatus.ACTIVE,
          });

          // Update member product count
          await this.memberService.memberStatsEditor({
            _id: input.memberId,
            targetKey: 'memberProducts',
            modifier: 1,
          });
        }
      }

      // 5. Auto-save as preset (upsert — update if exists, create if new)
      await this.presetModel.findOneAndUpdate(
        {
          memberId: input.memberId,
          productName: { $regex: new RegExp(`^${input.productName}$`, 'i') },
        },
        {
          $set: {
            productName: input.productName,
            memberId: input.memberId,
            ...(input.productCollection ? { productCollection: input.productCollection } : {}),
            ...(input.unit ? { unit: input.unit } : {}),
            ...(input.unitCost ? { defaultUnitCost: input.unitCost } : {}),
            ...(input.quantity ? { defaultQuantity: input.quantity } : {}),
            ...(input.productImages?.length ? { productImages: input.productImages } : {}),
            ...(input.productPrice ? { productPrice: input.productPrice } : {}),
            ...(input.productOriginPrice ? { productOriginPrice: input.productOriginPrice } : {}),
            ...(input.productDesc ? { productDesc: input.productDesc } : {}),
            ...(input.productOrigin ? { productOrigin: input.productOrigin } : {}),
          },
        },
        { upsert: true },
      );

      return purchase;
    } catch (error) {
      console.log('Error createPurchase:', error.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  /** Get purchase history with filters (date range, product name) */
  public async getPurchases(
    memberId: ObjectId,
    input: PurchasesInquiry,
  ): Promise<Purchases> {
    const { startDate, endDate, productName } = input.search;

    const match: T = { memberId };

    if (startDate || endDate) {
      match.purchaseDate = {};
      if (startDate) match.purchaseDate.$gte = new Date(startDate);
      if (endDate) match.purchaseDate.$lte = new Date(endDate);
    }

    if (productName) {
      match.productName = { $regex: new RegExp(productName, 'i') };
    }

    const sort: T = {
      [input.sort ?? 'purchaseDate']: input?.direction ?? Direction.DESC,
    };

    const result = await this.purchaseModel.aggregate([
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

  /**
   * Summary: aggregate purchases by product within a date range.
   * e.g. "How much red apple did I buy this week?"
   */
  public async getPurchaseSummary(
    memberId: ObjectId,
    input: PurchaseSummaryInput,
  ): Promise<PurchaseSummary> {
    const match: T = {
      memberId,
      purchaseDate: {
        $gte: new Date(input.startDate),
        $lte: new Date(input.endDate),
      },
    };

    if (input.productName) {
      match.productName = { $regex: new RegExp(input.productName, 'i') };
    }

    const result = await this.purchaseModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { productName: '$productName', unit: '$unit' },
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
        },
      },
      { $sort: { totalCost: -1 } },
    ]);

    const items = result.map((r) => ({
      productName: r._id.productName,
      unit: r._id.unit,
      totalQuantity: r.totalQuantity,
      totalCost: r.totalCost,
    }));

    const grandTotal = items.reduce((sum, item) => sum + item.totalCost, 0);

    return { items, grandTotal };
  }
}
