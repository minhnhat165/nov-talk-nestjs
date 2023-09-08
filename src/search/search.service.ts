import { FindParams } from 'src/common/types';
import { Injectable } from '@nestjs/common';
import { SearchMainResult } from './types';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SearchService {
  constructor(private readonly usersService: UsersService) {}

  async searchInbox({ q, limit }: FindParams): Promise<SearchMainResult> {
    const users = await this.usersService.find({
      q,
      limit,
    });
    return { users };
  }
}
