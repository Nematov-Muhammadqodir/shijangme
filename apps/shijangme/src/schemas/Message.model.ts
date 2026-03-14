import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  chatRoomId: ObjectId;

  @Prop({ required: true })
  senderId: ObjectId;

  @Prop({ required: false })
  text?: string;

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ default: 'text' })
  type: 'text' | 'image';
}

export const MessageSchema = SchemaFactory.createForClass(Message);
