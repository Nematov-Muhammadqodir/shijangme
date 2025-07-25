import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import {
  BoardArticle,
  BoardArticles,
} from '../../libs/dto/board-article/board-article';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import {
  BoardArticleInput,
  BoardArticlesInquiry,
} from '../../libs/dto/board-article/board-article.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import {
  lookupAuthMemberLiked,
  lookupMember,
  lookupMemberGeneral,
  shapeIntoMongoObjectId,
} from '../../libs/config';

@Injectable()
export class BoardArticleService {
  constructor(
    @InjectModel('BoardArticle')
    private readonly boardArticleModel: Model<BoardArticle>,
    private memberService: MemberService,
    private viewService: ViewService,
    private likeService: LikeService,
  ) {}

  public async createBoardArticle(
    memberId: ObjectId,
    input: BoardArticleInput,
  ): Promise<BoardArticle> {
    input.memberId = memberId;

    try {
      const newArticle = this.boardArticleModel.create(input);

      await this.memberService.memberStatsEditor({
        _id: memberId,
        targetKey: 'memberArticles',
        modifier: 1,
      });

      return newArticle;
    } catch (error) {
      console.log('Error createBoardArticle', error);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getBoardArticle(
    memberId: ObjectId,
    articleId: ObjectId,
  ): Promise<BoardArticle> {
    const search: T = {
      _id: articleId,
      articleStatus: BoardArticleStatus.ACTIVE,
    };

    const targetBoardArticle = await this.boardArticleModel
      .findOne(search)
      .lean()
      .exec();

    if (!targetBoardArticle)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (memberId) {
      const viewInput: ViewInput = {
        viewRefId: articleId,
        memberId: memberId,
        viewGroup: ViewGroup.ARTICLE,
      };

      const newView = await this.viewService.recordView(viewInput);

      if (newView) {
        await this.boardArticleStatsEditor({
          _id: articleId,
          targetKey: 'articleViews',
          modifier: 1,
        });

        targetBoardArticle.articleViews++;
      }

      const likeInput: LikeInput = {
        likeRefId: articleId,
        likeGroup: LikeGroup.ARTICLE,
        memberId: memberId,
      };

      targetBoardArticle.meLiked =
        await this.likeService.checkLikeExistance(likeInput);
    }

    targetBoardArticle.memberData = await this.memberService.getMember(
      null,
      targetBoardArticle.memberId,
    );

    return targetBoardArticle;
  }

  public async updateBoardArticle(
    memberId: ObjectId,
    input: BoardArticleUpdate,
  ): Promise<BoardArticle> {
    const { _id, articleStatus } = input;

    const result = await this.boardArticleModel.findOneAndUpdate(
      {
        _id: _id,
        memberId: memberId,
        articleStatus: BoardArticleStatus.ACTIVE,
      },
      input,
      { new: true },
    );

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (articleStatus === BoardArticleStatus.DELETE) {
      await this.memberService.memberStatsEditor({
        _id: memberId,
        targetKey: 'memberArticles',
        modifier: -1,
      });
    }

    return result;
  }

  public async getBoardArticles(
    memberId: ObjectId,
    input: BoardArticlesInquiry,
  ): Promise<BoardArticles> {
    const { articleCategory, text } = input.search;
    const match: T = { articleStatus: BoardArticleStatus.ACTIVE };
    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    if (articleCategory) match.articleCategory = articleCategory;
    if (text) {
      // Create a regex for case-insensitive search
      const textRegex = new RegExp(text, 'i');
      // Use $or to search across articleTitle AND articleContent
      match.$or = [
        { articleTitle: { $regex: textRegex } },
        { articleContent: { $regex: textRegex } },
      ];
    }
    if (input?.search?.memberId)
      match.memberId = shapeIntoMongoObjectId(input?.search?.memberId);

    console.log('match', match);

    const result = await this.boardArticleModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
              lookupAuthMemberLiked(memberId),
              lookupMemberGeneral,
              { $unwind: '$memberData' },
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

  public async likeTargetBoardArticle(
    memberId: ObjectId,
    articleId: ObjectId,
  ): Promise<BoardArticle> {
    const targetArticle = await this.boardArticleModel.findOne({
      _id: articleId,
      articleStatus: BoardArticleStatus.ACTIVE,
    });
    if (!targetArticle)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const likeInput: LikeInput = {
      likeGroup: LikeGroup.ARTICLE,
      likeRefId: articleId,
      memberId: memberId,
    };
    const modifier: number = await this.likeService.toggleLike(likeInput);

    const result = await this.boardArticleStatsEditor({
      _id: articleId,
      targetKey: 'articleLikes',
      modifier: modifier,
    });

    if (!result)
      throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

    return result;
  }

  public async boardArticleStatsEditor(
    input: StatisticModifier,
  ): Promise<BoardArticle> {
    console.log('Service: boardArticleStatsEditor');
    const { _id, targetKey, modifier } = input;

    return await this.boardArticleModel
      .findByIdAndUpdate(
        _id,
        { $inc: { [targetKey]: modifier } },
        { new: true },
      )
      .exec();
  }
}
