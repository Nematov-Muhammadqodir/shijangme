import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import {
  CreateChatRoomInput,
  SendMessageInput,
} from '../../libs/dto/chat/chat.input';
import { ChatRoomType, MessageType } from '../../libs/dto/chat/chat';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @Mutation(() => MessageType)
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @AuthMember('_id') memberId: string,
  ) {
    return this.chatService.createMessage(memberId, input);
  }

  @Query(() => [MessageType])
  async getMessages(@Args('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }

  @Mutation(() => ChatRoomType)
  async getOrCreateRoom(
    @Args('input') input: CreateChatRoomInput,
    @AuthMember('_id') memberId: string,
  ) {
    return this.chatService.getOrCreateRoom(memberId, input.targetUserId);
  }
}
