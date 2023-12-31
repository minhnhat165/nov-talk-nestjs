import { Injectable } from '@nestjs/common';
import { Message, MessageType } from './schemas/messages.schema';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateMessageDto } from './dtos';
import { UsersService } from 'src/users/users.service';
import { RoomsService } from 'src/rooms/rooms.service';
import {
  CursorPaginationInfo,
  ListQueryParamsCursor,
  Pagination,
} from 'src/common/types';
import { User } from 'src/users/schemas/user.schema';
import { selectPopulateField } from 'src/common/utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { socketConfig } from 'src/configs/socket.config';
import { NewMessagePayload } from 'src/events/types/message-payload.type';
import { convertMessageRemoved } from './utils/convert-message-removed';

@Injectable()
export class MessagesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    senderId: string,
  ): Promise<Message> {
    const user = await this.usersService.findById(senderId);
    const room = await this.roomsService.findByIdAndUserId(
      createMessageDto.roomId,
      user._id.toString(),
    );
    const createdMessage = new this.messageModel();
    createdMessage.sender = user;
    createdMessage.content = createMessageDto.content || '';
    createdMessage.media = createMessageDto.media || [];
    if (createdMessage.media.length > 0) {
      createdMessage.type = MessageType.MEDIA;
    }
    createdMessage.room = room;
    createdMessage.readBy = [user._id];
    createdMessage.deliveredTo = [user._id];
    const newMessage = await createdMessage.save();

    const newMessageWithSender = await newMessage.populate(
      'sender',
      selectPopulateField<User>(['_id', 'name', 'avatar']),
    );
    const socketPayload: NewMessagePayload = {
      roomId: String(room._id),
      message: newMessageWithSender,
      clientTempId: createMessageDto.clientTempId,
    };
    this.roomsService.updateRoom(String(newMessage.room._id), {
      lastMessage: newMessageWithSender,
      newMessageAt: new Date(),
    });
    this.eventEmitter.emit(socketConfig.events.message.new, socketPayload);
    return newMessageWithSender;
  }

  async findMessagesByRoomIdWithCursorPaginate(
    roomId: string,
    userId: string,
    params: ListQueryParamsCursor,
  ): Promise<Pagination<Message, CursorPaginationInfo>> {
    const { cursor = new this.messageModel()._id, limit = 10 } = params;

    const room = await this.roomsService.findByIdAndUserId(roomId, userId);
    const query: FilterQuery<Message> = {
      room: room._id,
      _id: { $lt: cursor },
    };

    const messages = await this.messageModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('sender', selectPopulateField<User>(['_id', 'name', 'avatar']));
    return {
      items: messages.map((message) => {
        return convertMessageRemoved(message, userId) as Message;
      }),
      pageInfo: {
        endCursor:
          messages.length > 0 ? String(messages[messages.length - 1]._id) : '',
        hasNextPage: messages.length === limit,
      },
    };
  }

  async remove(
    messageId: string,
    userId: string,
    removeType: 'me' | 'all' = 'me',
  ): Promise<Message> {
    const message = await this.messageModel
      .findById(messageId)
      .populate('sender', selectPopulateField<User>(['_id', 'name', 'avatar']));

    if (!message) {
      throw new Error('Message not found');
    }
    const room = await this.roomsService.findByIdAndUserId(
      message.room._id.toString(),
      userId,
    );

    if (removeType === 'me') {
      message.removedFor = [
        ...message.removedFor.map((id) => id.toString()),
        userId,
      ];
    } else {
      const isOwner = message.sender._id.toString() === userId;
      if (!isOwner) {
        throw new Error('You are not owner of this message');
      }
      message.removedFor = room.participants.map((p) => p._id);
    }
    await message.save();
    this.roomsService.updateRoom(String(room._id), {
      lastMessage: message,
    });
    this.eventEmitter.emit(socketConfig.events.message.remove, {
      roomId: String(room._id),
      message: convertMessageRemoved(message, userId),
    });
    return message;
  }
}
