import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Message } from '../../libs/dto/message/message';
import { MessageInput } from '../../libs/dto/message/message.input';
import { MemberService } from '../member/member.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    private readonly memberService: MemberService,
  ) {}

  public async createMessage(input: MessageInput): Promise<Message> {
    const targetMember = this.memberService.getMember(null, input.receiverId);
    if (!targetMember) throw new InternalServerErrorException('No data found!');

    try {
      const newMessage = await this.messageModel.create(input);

      return newMessage;
    } catch (err) {
      console.log('Error createMessage', err);
      throw new InternalServerErrorException('Sending new messaga failed!');
    }
  }

  public async getMessages(
    requestMemberId: ObjectId,
    userToChatId: ObjectId,
  ): Promise<Message[]> {
    const messages = await this.messageModel.find({
      $or: [
        { senderId: requestMemberId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: requestMemberId },
      ],
    });

    return messages;
  }
}
