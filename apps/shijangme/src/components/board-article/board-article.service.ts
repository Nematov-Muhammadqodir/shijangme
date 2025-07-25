import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { BoardArticleInput } from '../../libs/dto/board-article/board-article.input';
import { Message } from '../../libs/enums/common.enum';

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
}
