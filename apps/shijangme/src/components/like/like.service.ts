import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { OrdinaryInquery } from '../../libs/dto/product/product.input';
import { Product, Products } from '../../libs/dto/product/product';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupFavorite } from '../../libs/config';

@Injectable()
export class LikeService {
  constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

  public async toggleLike(input: LikeInput): Promise<number> {
    const search: T = {
        memberId: input.memberId,
        likeRefId: input.likeRefId,
        likeGroup: input.likeGroup,
      },
      exist = await this.likeModel.findOne(search).exec();

    let modifier = 1;
    if (exist) {
      await this.likeModel.findOneAndDelete(search).exec();
      modifier = -1;
    } else {
      try {
        await this.likeModel.create(input);
      } catch (err) {
        console.log('Error, Service.model', err.message);
        throw new BadRequestException(Message.CREATE_FAILED);
      }
    }

    console.log(`- Like modifier ${modifier}`);
    return modifier;
  }

  public async checkLikeExistance(input: LikeInput): Promise<MeLiked[]> {
    const { memberId, likeRefId } = input;

    const result = await this.likeModel
      .findOne({
        likeRefId: likeRefId,
        memberId: memberId,
      })
      .exec();

    return result
      ? [{ memberId: memberId, likeRefId: likeRefId, myFavorite: true }]
      : [];
  }

  public async getFavoriteProducts(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<Products> {
    console.log('getFavoriteProducts');
    const { page, limit } = input;
    const match: T = { memberId: memberId, likeGroup: LikeGroup.PRODUCT };

    const data: T = await this.likeModel
      .aggregate([
        { $match: match },
        { $sort: { updatedAt: Direction.DESC } },
        {
          $lookup: {
            from: 'products',
            localField: 'likeRefId',
            foreignField: '_id',
            as: 'favoriteProduct',
          },
        },
        { $unwind: '$favoriteProduct' },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupFavorite,
              { $unwind: '$favoriteProduct.productOwnerData' },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    console.log('dataList', data[0].list);

    const result: Products = { list: [], metaCounter: data[0].metaCounter };
    result.list = data[0].list.map((ele: any) => ele.favoriteProduct);
    console.log('result', result);

    return result;
  }
}
