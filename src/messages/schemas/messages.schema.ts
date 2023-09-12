import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Room } from 'src/rooms/schemas/room.schema';
import { User } from 'src/users/schemas/user.schema';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  CALL = 'call',
  MEDIA = 'media',
}

export enum MediaTypes {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

export type Media = {
  type: MediaTypes;
  url: string;
  name: string;
  size: number;
};

@Schema({
  timestamps: true,
})
export class Message {
  _id: mongoose.Schema.Types.ObjectId;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  sender: User;
  @Prop({ type: String })
  content: string;
  @Prop({ type: String, index: true, default: MessageType.TEXT })
  type: MessageType;
  @Prop({ type: Array, default: [] })
  media: Media[];
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room', index: true })
  room: Room;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  deliveredTo: User[];
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  readBy: User[];
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  removedFor: User[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
