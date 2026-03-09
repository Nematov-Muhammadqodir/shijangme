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
  @Field()
  targetUserId: string;
}
