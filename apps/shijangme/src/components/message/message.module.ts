import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageResolver } from './message.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import MessageSchema from '../../schemas/Message.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    AuthModule,
    MemberModule,
  ],
  providers: [MessageService, MessageResolver],
  exports: [MessageService],
})
export class MessageModule {}
