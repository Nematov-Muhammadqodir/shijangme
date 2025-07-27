import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, Messages } from '../../libs/dto/message/message';
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
}
