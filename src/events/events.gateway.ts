import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { socketConfig } from 'src/configs/socket.config';
import { NewMessagePayload } from './types/message-payload.type';
import { UpdateRoomPayload } from './types/room-payload.type';

@WebSocketGateway({ cors: '*' })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // constructor()
  // private readonly eventEmitter: EventEmitter2, // private readonly roomsService: RoomsService, // private readonly usersService: UsersService,
  // @InjectModel(Message) private readonly messageModel: Model<Message>,
  // {}
  @WebSocketServer()
  public server: Server;
  private clients: {
    [key: string]: {
      socketIds: string[];
    };
  } = {};
  afterInit(server: Server) {
    console.log('socket ', server?.engine?.clientsCount);
    // console.log('socket ', server?.engine?.clientsCount);
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    // console.log('socket ', client?.id);
  }
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // console.log('socket ', client?.id);
  }

  @SubscribeMessage('client.join')
  joinAdminRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ) {
    console.log('client.join', userId);
    client.join(userId.toString());
    this.clients[userId.toString()] = {
      socketIds: [
        ...(this.clients[userId.toString()]?.socketIds || []),
        client.id,
      ],
    };
  }

  @SubscribeMessage(socketConfig.events.room.join)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    console.log('handleJoinRoom', roomId);
    client.join(roomId);
  }

  @OnEvent(socketConfig.events.message.new)
  async handleNewMessage({ roomId, message }: NewMessagePayload) {
    console.log('handleNewMessage', roomId, message);
    this.server.to(roomId).emit(socketConfig.events.message.new, message);
  }
  @OnEvent(socketConfig.events.room.update)
  async handleUpdateRoom({ data, participants, roomId }: UpdateRoomPayload) {
    // console.log('handleUpdateRoom', roomId, data, participants);
    const socketIds = participants
      .map((p) => this.clients[p.toString()]?.socketIds || [])
      .flat();
    this.server.to(socketIds).emit(socketConfig.events.room.update, {
      roomId,
      data,
    });
  }
}
