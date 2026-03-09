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

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log('User connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('User disconnected:', client.id);
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
      text: string;
    },
  ) {
    // 1 save message in DB
    const message = await this.chatService.createMessage(payload.senderId, {
      chatRoomId: payload.chatRoomId,
      text: payload.text,
    });

    // 2 broadcast message to room
    this.server.to(payload.chatRoomId).emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { roomId: string; userId: string }) {
    client.to(payload.roomId).emit('userTyping', payload.userId);
  }
}
