import { Schema } from 'mongoose';
import { NotificationType } from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
  {
    notificationType: {
      type: String,
      enum: NotificationType,
      required: true,
    },
    notificationMessage: {
      type: String,
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default NotificationSchema;
