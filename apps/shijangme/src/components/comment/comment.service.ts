import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Comment } from '../../libs/dto/comment/comment';
import { MemberService } from '../member/member.service';
import { ProductService } from '../product/product.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { CommentInput } from '../../libs/dto/comment/comment.input';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    private readonly memberService: MemberService,
    private readonly productService: ProductService,
    private readonly boardArticleService: BoardArticleService,
  ) {}

  public async createComment(
    memberId: ObjectId,
    input: CommentInput,
  ): Promise<Comment> {
    input.memberId = memberId;

    let result = null;

    try {
      result = await this.commentModel.create(input);
    } catch (error) {
      console.log('CreateComment Error', error);
      throw new InternalServerErrorException(error.message);
    }

    switch (input.commentGroup) {
      case CommentGroup.ARTICLE:
        await this.boardArticleService.boardArticleStatsEditor({
          _id: input.commentRefId,
          targetKey: 'articleComments',
          modifier: 1,
        });
        break;

      case CommentGroup.MEMBER:
        await this.memberService.memberStatsEditor({
          _id: input.commentRefId,
          targetKey: 'memberComments',
          modifier: 1,
        });
        break;

      case CommentGroup.PRODUCT:
        await this.productService.productStatsEditor({
          _id: input.commentRefId,
          targetKey: 'productComments',
          modifier: 1,
        });
        break;
    }
    if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
    console.log('Comment result', result);

    return result;
  }

  public async updateComment(
    memberId: ObjectId,
    input: CommentUpdate,
  ): Promise<Comment> {
    const updatedComment = await this.commentModel
      .findOneAndUpdate(
        {
          _id: input._id,
          memberId: memberId,
          commentStatus: CommentStatus.ACTIVE,
        },
        input,
        { new: true },
      )
      .exec();

    if (!updatedComment)
      throw new InternalServerErrorException(Message.UPDATE_FAILED);

    return updatedComment;
  }
}
