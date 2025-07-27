import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class MessageInput {
  senderId?: ObjectId;

  @IsNotEmpty()
  @Field(() => String)
  receiverId: ObjectId;

  @IsNotEmpty()
  @Field(() => String)
  text: String;
}
