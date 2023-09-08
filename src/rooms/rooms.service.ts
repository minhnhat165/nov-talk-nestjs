import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { selectPopulateField } from 'src/common/utils';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { CreateRoomDto } from './dtos';
import { Room, RoomStatus } from './schemas/room.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CursorPaginationInfo,
  ListQueryParams,
  ListQueryParamsCursor,
  Pagination,
} from 'src/common/types';
@Injectable()
export class RoomsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(Room.name) private readonly roomModel: Model<Room>,
  ) {}
  async createRoom(createRoomDto: CreateRoomDto, creatorId: string) {
    const participants = await Promise.all(
      [creatorId, ...createRoomDto.participants].map((id) =>
        this.usersService.findById(id),
      ),
    );
    const isGroup = participants.length > 2;
    if (!isGroup && participants.length !== 2) {
      throw new BadRequestException('Participants must be 2 users');
    }

    if (!isGroup) {
      const room = await this.findByParticipantIds(
        participants.map((p) => p._id),
      );
      if (room) {
        return room;
      }
    }

    const newRoom = new this.roomModel(createRoomDto);
    newRoom.participants = participants;
    newRoom.name = createRoomDto.name || '';
    newRoom.isGroup = isGroup;

    const room = await this.roomModel.create(newRoom);
    return room;
  }

  async deleteRoom(id: string, userId: string) {
    const room = await this.roomModel.findOne({
      _id: id,
      participants: userId,
    });
    if (!room) {
      throw new Error('Room not found');
    }
    room.status = RoomStatus.DELETED;
    await room.save();
    return room;
  }

  async findByParticipantIds(
    participantIds: ObjectId[] | string[],
    inCludeDeleted = false,
  ) {
    const room = await this.roomModel
      .findOne({
        participants: {
          $eq: participantIds,
        },
        ...(inCludeDeleted ? {} : { status: RoomStatus.ACTIVE }),
      })
      .populate(
        selectPopulateField<Room>(['participants']),
        selectPopulateField<User>([
          '_id',
          'name',
          'avatar',
          'email',
          'username',
        ]),
      );

    return room;
  }

  async findByIdAndUserId(id: string, userId: string, inCludeDeleted = false) {
    let room = await this.roomModel.findOne({
      _id: id,
      participants: userId,
      ...(inCludeDeleted ? {} : { status: RoomStatus.ACTIVE }),
    });
    if (!room) {
      room = await this.findByParticipantIds([id, userId]);
    }
    if (!room) {
      room = new this.roomModel();
      try {
        const participants = await Promise.all(
          [userId, id].map((id) => this.usersService.findById(id)),
        );
        room.participants = participants;
        room.status = RoomStatus.TEMPORARY;
      } catch (error) {
        throw new NotFoundException('Room not found');
      }
    }
    return await room.populate(
      selectPopulateField<Room>(['participants']),
      selectPopulateField<User>(['_id', 'name', 'avatar', 'email', 'username']),
    );
  }

  async findWithCursorPaginate(
    queryParams: ListQueryParamsCursor,
    userId: string,
  ): Promise<Pagination<Room, CursorPaginationInfo>> {
    const { limit = 10, cursor } = queryParams;

    const query: FilterQuery<Room> = {
      newMessageAt: {
        $lt: cursor ? new Date(cursor).toISOString() : new Date().toISOString(),
      },
      participants: userId,
    };

    const rooms = await this.roomModel
      .find(query)
      .sort({ newMessageAt: -1 })
      .limit(limit)
      .populate(
        selectPopulateField<Room>(['participants']),
        selectPopulateField<User>([
          '_id',
          'name',
          'avatar',
          'email',
          'username',
        ]),
      );
    const pageInfo: CursorPaginationInfo = {
      endCursor: rooms[rooms.length - 1]?.newMessageAt?.toISOString(),
      hasNextPage: rooms.length === limit,
    };

    return {
      items: rooms,
      pageInfo,
    };
  }
}
