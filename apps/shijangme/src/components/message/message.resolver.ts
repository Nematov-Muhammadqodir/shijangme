import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MessageService } from './message.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Message } from '../../libs/dto/message/message';
import { MessageInput } from '../../libs/dto/message/message.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Message)
  public async createMessage(
    @Args('input') input: MessageInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Message> {
    console.log('Mutation createMessage');
    input.receiverId = shapeIntoMongoObjectId(input.receiverId);
    input.senderId = memberId;

    return await this.messageService.createMessage(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Message])
  public async getMessages(
    @Args('input') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Message[]> {
    console.log('Query getMessages');
    const userToChatId = shapeIntoMongoObjectId(input);

    return await this.messageService.getMessages(memberId, userToChatId);
  }
}
