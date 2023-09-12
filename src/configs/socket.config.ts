export const socketConfig = {
  events: {
    message: {
      new: 'message.new',
    },
    room: {
      join: 'room.join',
      update: 'room.update',
    },
  },
};
