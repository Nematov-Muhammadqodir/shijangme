import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class MessageType {
  @Field(() => ID)
  _id: string;

  @Field()
  chatRoomId: string;

  @Field()
  senderId: string;

  @Field()
  text: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ChatRoomType {
  @Field(() => ID)
  _id: string;

  @Field(() => [String])
  participants: string[];

  @Field({ nullable: true })
  lastMessage?: string;

  @Field()
  createdAt: Date;
}
