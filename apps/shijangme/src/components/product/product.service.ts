import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Product, Products } from '../../libs/dto/product/product';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import {
  AllProductsInquery,
  OrdinaryInquery,
  ProductInput,
  ProductsInquiry,
  VendorProductsInquery,
} from '../../libs/dto/product/product.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ProductStatus } from '../../libs/enums/product.enum';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import * as moment from 'moment';
import { skip } from 'node:test';
import { lookupAuthMemberLiked, lookupMember } from '../../libs/config';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Product') private readonly productModel: Model<Product>,
    private memberService: MemberService,
    private viewService: ViewService,
    private likeService: LikeService,
  ) {}

  public async createProduct(input: ProductInput): Promise<Product> {
    try {
      console.log('productInput', input);
      const result = await this.productModel.create(input);

      await this.memberService.memberStatsEditor({
        _id: result.productOwnerId,
        targetKey: 'memberProducts',
        modifier: 1,
      });

      return result;
    } catch (error) {
      console.log('Error createProduct in service', error.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getProduct(
    memberId: ObjectId,
    productId: ObjectId,
  ): Promise<Product> {
    const search: T = {
      _id: productId,
      productStatus: ProductStatus.ACTIVE,
    };

    const targetProduct: Product = await this.productModel
      .findOne(search)
      .lean()
      .exec();
    console.log('targetProduct', targetProduct);

    if (!targetProduct)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    console.log('memberId', memberId);

    if (memberId) {
      const viewInput: ViewInput = {
        memberId: memberId,
        viewRefId: productId,
        viewGroup: ViewGroup.PRODUCT,
      };

      const newView = await this.viewService.recordView(viewInput);
      if (newView) {
        await this.productStatsEditor({
          _id: productId,
          targetKey: 'productViews',
          modifier: 1,
        });
        targetProduct.productViews++;
      }

      const likeInput: LikeInput = {
        memberId: memberId,
        likeRefId: productId,
        likeGroup: LikeGroup.PRODUCT,
      };

      targetProduct.meLiked =
        await this.likeService.checkLikeExistance(likeInput);
    }
    console.log(' targetProduct.productOwnerData before', targetProduct);
    targetProduct.productOwnerData = await this.memberService.getMember(
      null,
      targetProduct.productOwnerId,
    );
    console.log(' targetProduct.productOwnerData after', targetProduct);

    return targetProduct;
  }

  public async updateProduct(
    productOwnerId: ObjectId,
    input: ProductUpdate,
  ): Promise<Product> {
    let { productStatus, deletedAt, soldAt } = input;

    const search = {
      _id: input._id,
      productOwnerId: productOwnerId,
    };

    if (productStatus === ProductStatus.DELETE) deletedAt = moment().toDate();
    if (productStatus === ProductStatus.SOLD) soldAt = moment().toDate();

    const result = await this.productModel.findOneAndUpdate(search, input, {
      new: true,
    });

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (soldAt || deletedAt) {
      await this.memberService.memberStatsEditor({
        _id: productOwnerId,
        targetKey: 'memberProducts',
        modifier: -1,
      });
    }
    if (productStatus === ProductStatus.ACTIVE) {
      await this.memberService.memberStatsEditor({
        _id: productOwnerId,
        targetKey: 'memberProducts',
        modifier: 1,
      });
    }

    return result;
  }

  public async getProducts(
    memberId: ObjectId,
    input: ProductsInquiry,
  ): Promise<Products> {
    console.log('memberId', memberId);
    const match: T = { productStatus: ProductStatus.ACTIVE };
    const sort: T = {
      [input.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
    };

    if (input.search.productOwnerId) {
      match.productOwnerId = input.search.productOwnerId;
    }
    if (input.search.productCollection) {
      match.productCollection = input.search.productCollection;
    }
    if (input.search.productVolume) {
      match.productVolume = input.search.productVolume;
    }
    if (input.search.text) {
      match.productName = { $regex: new RegExp(input.search.text, 'i') };
    }
    if (input.search.productOrigin) {
      match.productOrigin = input.search.productOrigin;
    }
    if (input.search.productDiscountRate) {
      match.productDiscountRate = input.search.productDiscountRate;
    }

    const result = await this.productModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupAuthMemberLiked(memberId),
            lookupMember,
            { $unwind: '$productOwnerData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);
    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0] as Products;
  }

  public async getFavorites(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<Products> {
    return await this.likeService.getFavoriteProducts(memberId, input);
  }

  public async getVisited(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<Products> {
    const result = await this.viewService.getVisitedProducts(memberId, input);
    console.log('getVisited esult', result);
    return result;
  }

  public async productStatsEditor(input: StatisticModifier): Promise<Product> {
    console.log('Service: productStatsEditor');
    const { _id, targetKey, modifier } = input;

    return await this.productModel.findByIdAndUpdate(
      { _id: _id },
      { $inc: { [targetKey]: modifier } },
      { new: true },
    );
  }

  public async getVendorProducts(
    memberId: ObjectId,
    input: VendorProductsInquery,
  ): Promise<Products> {
    const { productStatus } = input.search;

    const match: T = {
      productOwnerId: memberId,
      productStatus: productStatus ?? { $ne: ProductStatus.DELETE },
    };

    const sort: T = {
      [input.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
    };

    const result = await this.productModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupMember,
            { $unwind: '$productOwnerData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async likeTargetProduct(
    memberId: ObjectId,
    productId: ObjectId,
  ): Promise<Product> {
    const target: Product = await this.productModel
      .findOne({
        _id: productId,
        productStatus: ProductStatus.ACTIVE,
      })
      .exec();

    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const likeInput: LikeInput = {
      memberId: memberId,
      likeRefId: productId,
      likeGroup: LikeGroup.PRODUCT,
    };

    const modifier = await this.likeService.toggleLike(likeInput);

    const result = await this.productStatsEditor({
      _id: productId,
      targetKey: 'productLikes',
      modifier: modifier,
    });

    if (!result)
      throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

    return result;
  }

  public async getAllProductsByAdmin(
    input: AllProductsInquery,
  ): Promise<Products> {
    const { productStatus, productFromList } = input.search;

    const match: T = {};

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    if (productStatus) match.productStatus = productStatus;
    if (productFromList) match.productOrigin = { $in: productFromList };

    const result = await this.productModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupMember,
            { $unwind: '$productOwnerData' },
          ],
        },
      },
    ]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0] as Products;
  }

  public async updateProductByAdmin(input: ProductUpdate): Promise<Product> {
    let { soldAt, deletedAt, productStatus } = input;

    const search: T = {
      _id: input._id,
      productStatus: ProductStatus.ACTIVE,
    };

    if ((productStatus = ProductStatus.SOLD)) soldAt = moment().toDate();
    if ((productStatus = ProductStatus.DELETE)) deletedAt = moment().toDate();

    const result = await this.productModel
      .findOneAndUpdate(search, input, {
        new: true,
      })
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPLOAD_FAILED);

    if (soldAt || deletedAt) {
      await this.memberService.memberStatsEditor({
        _id: result.productOwnerId,
        targetKey: 'memberProducts',
        modifier: -1,
      });
    }

    return result;
  }

  public async deleteProductByAdmin(productId: ObjectId): Promise<Product> {
    const search: T = { _id: productId, productStatus: ProductStatus.DELETE };

    const result = await this.productModel.findOneAndDelete(search).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

    return result;
  }
}
