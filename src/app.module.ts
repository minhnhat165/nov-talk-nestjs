import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards/access-token.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { Database } from './database/database';
import { Messages } from './messages/messages';
import { MessagesModule } from './messages/messages.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Rooms } from './rooms/rooms';
import { RoomsController } from './rooms/rooms.controller';
import { RoomsModule } from './rooms/rooms.module';
import { RoomsService } from './rooms/rooms.service';
import { UsersModule } from './users/users.module';
import { envConfig } from './configs/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(envConfig.database.uri),
    UsersModule,
    MessagesModule,
    RoomsModule,
    AuthModule,
    PassportModule.register({ session: true }),
  ],
  controllers: [AppController, RoomsController],
  providers: [
    AppService,
    Database,
    Messages,
    RoomsService,
    Rooms,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
  ],
})
export class AppModule {}
