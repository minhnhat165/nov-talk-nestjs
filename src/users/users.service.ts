import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async getProfile(id: string) {
    const user = await this.userModel
      .findById(id)
      .select({
        name: true,
        username: true,
        avatar: true,
        email: true,
      })
      .lean();
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return user;
  }
}
