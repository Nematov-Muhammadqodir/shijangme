import { Module } from '@nestjs/common';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatRoomSchema } from '../../schemas/ChatRoom..model';
import { MessageSchema } from '../../schemas/Message.model';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ChatRoom', schema: ChatRoomSchema },
      { name: 'Message', schema: MessageSchema },
    ]),
  ],
  providers: [ChatResolver, ChatService, ChatGateway],
})
export class ChatModule {}
