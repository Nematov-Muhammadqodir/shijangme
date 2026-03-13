import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Message } from '../../libs/dto/message/message';
import { SendMessageInput } from '../../libs/dto/chat/chat.input';
import { ChatRoomType, MessageType } from '../../libs/dto/chat/chat';
import { ChatRoom } from '../../schemas/ChatRoom..model';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message')
    private messageModel: Model<MessageType>,
    @InjectModel('ChatRoom')
    private chatRoomModel: Model<ChatRoom>,
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

  async getOrCreateRoom(userA: ObjectId, userB: string) {
    let room = await this.chatRoomModel.findOne({
      participants: { $all: [userA, userB] },
    });

    if (!room) {
      room = await this.chatRoomModel.create({
        participants: [userA, userB],
      });
    }

    await room.populate('participants');
    return room;
  }

  async getChatRoom(roomId: ObjectId) {
    const room = await this.chatRoomModel
      .findById(roomId)
      .populate('participants');

    if (!room) {
      throw new Error('Chat room not found');
    }

    return room;
  }
}
