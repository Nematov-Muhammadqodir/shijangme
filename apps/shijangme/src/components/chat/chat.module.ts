import { Module } from '@nestjs/common';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatRoomSchema } from '../../schemas/ChatRoom..model';
import { MessageSchema } from '../../schemas/Message.model';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ChatRoom', schema: ChatRoomSchema },
      { name: 'Message', schema: MessageSchema },
    ]),
    AuthModule,
  ],
  providers: [ChatResolver, ChatService, ChatGateway],
})
export class ChatModule {}
