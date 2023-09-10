import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryParamsDto } from './dtos/search-query-params.dto';
import { SearchService } from './search.service';
import { User } from 'src/users/schemas/user.schema';
import { Response } from 'src/common/types';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  @Get('inbox')
  async searchInbox(@Query() query: SearchQueryParamsDto) {
    query.limit = query.limit || 20;
    return this.searchService.searchInbox(query);
  }

  @Get('users')
  async searchUsers(
    @Query() query: SearchQueryParamsDto,
  ): Promise<Response<User[]>> {
    query.limit = query.limit || 20;
    const users = await this.searchService.searchUsers(query);
    return {
      data: users,
      message: 'Users found',
    };
  }
}
