import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SendMessageInput {
  @Field()
  chatRoomId: string;

  @Field({ nullable: true })
  text?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  type: string;
}

@InputType()
export class CreateChatRoomInput {
  constructor() {
    console.log('Hereeeee');
  }
  @Field()
  targetUserId: string;
}
