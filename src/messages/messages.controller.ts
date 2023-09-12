import { Body, Controller, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtUserId } from 'src/common/decorators';
import { CreateMessageDto } from './dtos';
import { Message } from './schemas/messages.schema';
import { Response } from 'src/common/types';

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
}
