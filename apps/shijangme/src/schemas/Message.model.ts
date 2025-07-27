import { Schema } from 'mongoose';

const MessageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, collection: 'messages' },
);

export default MessageSchema;
