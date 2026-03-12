import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import {
  CreateChatRoomInput,
  SendMessageInput,
} from '../../libs/dto/chat/chat.input';
import { ChatRoomType, MessageType } from '../../libs/dto/chat/chat';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { UseGuards } from '@nestjs/common';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

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

  @UseGuards(AuthGuard)
  @Mutation(() => ChatRoomType)
  async getOrCreateRoom(
    @Args('input') input: CreateChatRoomInput,
    @AuthMember('_id') memberId: ObjectId,
  ) {
    console.log('memberId', memberId);
    input.targetUserId = shapeIntoMongoObjectId(input.targetUserId);
    return this.chatService.getOrCreateRoom(memberId, input.targetUserId);
  }

  @UseGuards(AuthGuard)
  @Query(() => ChatRoomType)
  async getChatRoom(@Args('roomId', { type: () => String }) roomId: string) {
    console.log('roomObjectId', roomId);
    const roomObjectId = shapeIntoMongoObjectId(roomId);
    return this.chatService.getChatRoom(roomObjectId);
  }
}
