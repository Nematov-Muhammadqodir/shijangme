import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class ChatRoom {
  @Prop({ type: [Types.ObjectId], ref: 'Member', required: true })
  participants: Types.ObjectId[];

  @Prop()
  lastMessage: string;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
