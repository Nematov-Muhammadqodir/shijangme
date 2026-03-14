import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private onlineUsers = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

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
    const message = await this.chatService.createMessage(
      payload.senderId,
      payload,
    );

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
}
