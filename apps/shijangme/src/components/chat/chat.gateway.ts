import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';
import { MemberService } from '../member/member.service';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { NotificationType } from '../../libs/enums/notification.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private onlineUsers = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private redisService: RedisService,
    private readonly memberService: MemberService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    console.log('Handshake auth:', client.handshake.auth);
    if (!userId) {
      console.log('No userId received');
      return;
    }

    this.onlineUsers.set(userId, client.id);

    console.log('User connected:', userId);

    this.server.emit('onlineUsers', Array.from(this.onlineUsers.keys()));
  }

  handleDisconnect(client: Socket) {
    let disconnectedUserId: string | null = null;

    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        this.onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      console.log('User disconnected:', disconnectedUserId);
    }

    this.server.emit('onlineUsers', Array.from(this.onlineUsers.keys()));
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);

    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: {
      chatRoomId: string;
      senderId: string;
      text?: string;
      imageUrl?: string;
      type: 'text' | 'image';
    },
  ) {
    const follower = await this.memberService.getMember(
      null,
      shapeIntoMongoObjectId(payload.senderId),
    );

    const participants = await this.chatService.getChatRoom(
      shapeIntoMongoObjectId(payload.chatRoomId),
    );
    const message = await this.chatService.createMessage(
      payload.senderId,
      payload,
    );

    if (message) {
      await this.redisService.publish('chat-events', {
        event: NotificationType.SEND_MESSAGE,
        receiverId: participants.participants.filter(
          (participant) => String(participant) !== payload.senderId,
        )[0],
        senderId: payload.senderId,
        senderName: follower.memberNick,
      });
    }

    this.server.to(payload.chatRoomId).emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { roomId: string; userId: string }) {
    client.to(payload.roomId).emit('userTyping', payload.userId);
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(client: Socket) {
    // Send current online users to just this client
    client.emit('onlineUsers', Array.from(this.onlineUsers.keys()));
  }

  /** Send a targeted notification to a specific user (if online) */
  public sendNotification(targetUserId: string, event: string, payload: any) {
    const socketId = this.onlineUsers.get(targetUserId);
    if (socketId) {
      this.server.to(socketId).emit(event, payload);
      console.log(`Notification sent to ${targetUserId}: ${event}`);
    }
  }
}
