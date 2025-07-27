import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';

@ObjectType()
export class Message {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  senderId: ObjectId;

  @Field(() => String)
  receiverId: ObjectId;

  @Field(() => String)
  text: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Messages {
  list: Message[];
}
