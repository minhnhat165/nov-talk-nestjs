import { Body, Controller, Post, Delete, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtUserId, ParamObjectId } from 'src/common/decorators';
import { CreateMessageDto } from './dtos';
import { Message } from './schemas/messages.schema';
import { Response } from 'src/common/types';
import { RemoveParamsMessageDto } from './dtos/remove-params-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Post()
  async create(
    @JwtUserId() senderId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Response<Message>> {
    const message = await this.messagesService.create(
      createMessageDto,
      senderId,
    );

    return {
      data: message,
      message: 'Message created',
    };
  }
  @Delete(':id')
  async remove(
    @JwtUserId() userId: string,
    @ParamObjectId() id: string,
    @Query() { type }: RemoveParamsMessageDto,
  ) {
    await this.messagesService.remove(id, userId, type);
    return {
      data: null,
      message: 'Message deleted',
    };
  }
}
