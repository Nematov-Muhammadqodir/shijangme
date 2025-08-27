import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { Products } from '../../libs/dto/product/product';
import { OrdinaryInquery } from '../../libs/dto/product/product.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { Direction } from '../../libs/enums/common.enum';
import { lookupVisit } from '../../libs/config';

@Injectable()
export class ViewService {
  constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

  public async recordView(input: ViewInput) {
    const viewExist = await this.checkViewExistance(input);

    if (!viewExist) {
      console.log('- New View Insert -');

      return await this.viewModel.create(input);
    } else {
      return null;
    }
  }

  public async checkViewExistance(input: ViewInput): Promise<View> {
    const { memberId, viewRefId } = input;

    const search: T = { memberId: memberId, viewRefId: viewRefId };

    return await this.viewModel.findOne(search).exec();
  }

  public async getVisitedProducts(
    memberId: ObjectId,
    input: OrdinaryInquery,
  ): Promise<Products> {
    console.log('getVisitedProducts');

    console.log('memberId', memberId);
    const { limit, page } = input;
    const match: T = { memberId: memberId, viewGroup: ViewGroup.PRODUCT };

    const data: T = await this.viewModel.aggregate([
      {
        $match: match,
      },
      { $sort: { updatedAt: Direction.DESC } },
      {
        $lookup: {
          from: 'products',
          localField: 'viewRefId',
          foreignField: '_id',
          as: 'visitedProduct',
        },
      },
      { $unwind: '$visitedProduct' },
      {
        $facet: {
          list: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            lookupVisit,
            { $unwind: '$visitedProduct.productOwnerData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    const result: Products = { list: [], metaCounter: data[0].metaCounter };
    result.list = data[0].list.map((ele) => ele.visitedProduct);

    return result;
  }
}
