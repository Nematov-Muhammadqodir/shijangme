import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SendMessageInput {
  @Field()
  chatRoomId: string;

  @Field()
  text: string;
}

@InputType()
export class CreateChatRoomInput {
  constructor() {
    console.log('Hereeeee');
  }
  @Field()
  targetUserId: string;
}
