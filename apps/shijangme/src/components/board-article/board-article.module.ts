import { Module } from '@nestjs/common';
import { BoardArticleResolver } from './board-article.resolver';
import { BoardArticleService } from './board-article.service';
import { MongooseModule } from '@nestjs/mongoose';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import { MemberModule } from '../member/member.module';
import { AuthModule } from '../auth/auth.module';
import { LikeModule } from '../like/like.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'BoardArticle', schema: BoardArticleSchema },
    ]),
    MemberModule,
    AuthModule,
    LikeModule,
    CommentModule,
  ],
  providers: [BoardArticleResolver, BoardArticleService],
  exports: [BoardArticleService],
})
export class BoardArticleModule {}
