import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Product } from '../../libs/dto/product/product';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { ProductInput } from '../../libs/dto/product/product.input';
import { Message } from '../../libs/enums/common.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ProductStatus } from '../../libs/enums/product.enum';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

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

  public async productStatsEditor(input: StatisticModifier): Promise<Product> {
    console.log('Service: productStatsEditor');
    const { _id, targetKey, modifier } = input;

    return await this.productModel.findByIdAndUpdate(
      { _id: _id },
      { $inc: { [targetKey]: modifier } },
      { new: true },
    );
  }
}
