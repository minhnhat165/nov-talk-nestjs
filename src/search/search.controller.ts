import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryParamsDto } from './dtos/search-query-params.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  @Get('inbox')
  async searchInbox(@Query() query: SearchQueryParamsDto) {
    query.limit = query.limit || 20;
    return this.searchService.searchInbox(query);
  }
}
