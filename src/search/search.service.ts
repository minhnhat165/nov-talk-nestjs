import { FindParams } from 'src/common/types';
import { Injectable } from '@nestjs/common';
import { RoomStatus } from 'src/rooms/schemas/room.schema';
import { RoomsService } from 'src/rooms/rooms.service';
import { SearchMainResult } from './types';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
  ) {}

  async searchInbox(
    { q, limit }: FindParams,
    userId: string,
  ): Promise<SearchMainResult> {
    const users = await this.searchUsers({ q, limit });
    const userIds = users.map((u) => u._id);
    const rooms = await this.roomsService.search({
      query: {
        $or: [
          {
            name: { $regex: q, $options: 'i' },
            participants: userId,
          },
          {
            $and: [
              {
                participants: {
                  $in: [userId],
                },
              },
              {
                participants: {
                  $in: userIds,
                },
              },
            ],
          },
        ],
        status: RoomStatus.ACTIVE,
        isGroup: true,
      },
      limit,
    });
    return {
      users,
      rooms,
    };
  }

  async searchUsers({ q, limit }: FindParams): Promise<User[]> {
    const users = await this.usersService.find({
      q,
      limit,
    });
    return users;
  }
}
