import { Controller, Get } from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtUserId } from 'src/common/decorators';
import { UsersService } from 'src/users/users.service';
import { SingleResponse } from 'src/common/types';
import { User } from 'src/users/schemas/user.schema';
import { Tokens } from './types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
  @Get('remote-login')
  async remoteLogin(@JwtUserId() userId: string): Promise<
    SingleResponse<{
      tokens: Tokens;
      user: User;
    }>
  > {
    const user = await this.usersService.getProfile(userId);
    const tokens = await this.authService.createTokens({ id: userId });
    return {
      message: 'ok',
      data: {
        tokens,
        user,
      },
    };
  }
  @Get('me')
  async getProfile(@JwtUserId() userId: string): Promise<SingleResponse<User>> {
    const user = await this.usersService.getProfile(userId);
    return { message: 'ok', data: user };
  }
}
