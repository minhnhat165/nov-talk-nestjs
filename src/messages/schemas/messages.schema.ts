import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { User } from 'src/users/schemas/user.schema';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'file',
  MEDIA = 'media',
  CALL = 'call',
  Link = 'link',
  VIDEO = 'video',
  VOICE = 'voice',
}

@Schema({
  timestamps: true,
})
export class Message {
  _id: mongoose.Schema.Types.ObjectId;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  sender: User;
  @Prop({ type: String })
  content: string;
  @Prop({ type: String, index: true })
  type: MessageType;
  @Prop({ type: Array, default: [] })
  media: string[];
  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room' })
  // room: Room;

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
