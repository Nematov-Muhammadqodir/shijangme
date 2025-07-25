import { Module } from '@nestjs/common';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import OrderItemSchema from '../../schemas/OrderItem.model';
import OrderSchema from '../../schemas/Order.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'OrderItem', schema: OrderItemSchema },
      { name: 'Order', schema: OrderSchema },
    ]),
    AuthModule,
    MemberModule,
  ],
  providers: [OrderResolver, OrderService],
})
export class OrderModule {}
