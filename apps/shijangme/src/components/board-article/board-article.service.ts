import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { BoardArticleInput } from '../../libs/dto/board-article/board-article.input';
import { Message } from '../../libs/enums/common.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

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
