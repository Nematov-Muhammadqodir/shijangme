import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Member } from '../member/member';

@ObjectType()
export class MessageType {
  @Field(() => ID)
  _id: string;

  @Field()
  chatRoomId: string;

  @Field()
  senderId: string;

  @Field({ nullable: true })
  text?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  type: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ChatRoomType {
  constructor() {
    console.log('Byeee');
  }
  @Field(() => ID)
  _id: string;

  @Field(() => [Member])
  participants: Member[];

  @Field({ nullable: true })
  lastMessage?: string;

  @Field()
  createdAt: Date;
}
