import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { FollowModule } from './follow/follow.module';
import { LikeModule } from './like/like.module';
import { ProductModule } from './product/product.module';
import { ViewModule } from './view/view.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { NoticeModule } from './notice/notice.module';

@Module({
  imports: [MemberModule, AuthModule, CommentModule, FollowModule, LikeModule, ProductModule, ViewModule, BoardArticleModule, MessageModule, NotificationModule, OrderModule, NoticeModule]
})
export class ComponentsModule {}
