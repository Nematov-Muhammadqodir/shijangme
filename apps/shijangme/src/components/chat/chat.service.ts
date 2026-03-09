import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../../libs/dto/message/message';
import { SendMessageInput } from '../../libs/dto/chat/chat.input';
import { ChatRoomType, MessageType } from '../../libs/dto/chat/chat';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message')
    private messageModel: Model<MessageType>,
    @InjectModel('ChatRoom')
    private chatRoomModel: Model<ChatRoomType>,
  ) {}

  async createMessage(senderId: string, input: SendMessageInput) {
    const message = await this.messageModel.create({
      senderId,
      chatRoomId: input.chatRoomId,
      text: input.text,
    });

    return message;
  }

  async getMessages(roomId: string) {
    return this.messageModel
      .find({ chatRoomId: roomId })
      .sort({ createdAt: 1 });
  }

  async getOrCreateRoom(userA: string, userB: string) {
    let room = await this.chatRoomModel.findOne({
      participants: { $all: [userA, userB] },
    });

    if (!room) {
      room = await this.chatRoomModel.create({
        participants: [userA, userB],
      });
    }

    return room;
  }
}
