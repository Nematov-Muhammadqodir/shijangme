import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiAgentService } from './ai-agent.service';
import { AiAgentResolver } from './ai-agent.resolver';
import ProductSchema from '../../schemas/Product.model';
import MemberSchema from '../../schemas/Member.model';
import OrderSchema from '../../schemas/Order.model';
import OrderItemSchema from '../../schemas/OrderItem.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import CommentSchema from '../../schemas/Comment.model';
import NoticeSchema from '../../schemas/Notice.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema },
      { name: 'Member', schema: MemberSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'OrderItem', schema: OrderItemSchema },
      { name: 'BoardArticle', schema: BoardArticleSchema },
      { name: 'Comment', schema: CommentSchema },
      { name: 'Notice', schema: NoticeSchema },
    ]),
  ],
  providers: [AiAgentService, AiAgentResolver],
})
export class AiAgentModule {}
