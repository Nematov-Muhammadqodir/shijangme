import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { FollowModule } from './follow/follow.module';
import { LikeModule } from './like/like.module';
import { ProductModule } from './product/product.module';
import { ViewModule } from './view/view.module';
import { BoardArticleModule } from './board-article/board-article.module';

import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { NoticeModule } from './notice/notice.module';
import { StripeService } from './stripe/stripe.service';
import { StripeResolver } from './stripe/stripe.resolver';

import { ChatModule } from './chat/chat.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { FridgeModule } from './fridge/fridge.module';
import { BillModule } from './bill/bill.module';
import { PurchaseModule } from './purchase/purchase.module';
import { PresetProductModule } from './preset-product/preset-product.module';
import { LoanModule } from './loan/loan.module';

@Module({
  imports: [
    MemberModule,
    AuthModule,
    CommentModule,
    FollowModule,
    LikeModule,
    ProductModule,
    ViewModule,
    BoardArticleModule,
    NotificationModule,
    OrderModule,
    NoticeModule,
    ChatModule,
    AiAgentModule,
    FridgeModule,
    BillModule,
    PurchaseModule,
    PresetProductModule,
    LoanModule,
  ],
  providers: [StripeService, StripeResolver],
})
export class ComponentsModule {}
