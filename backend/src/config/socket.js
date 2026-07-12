const socketIo = require('socket.io');

let io;

const initSocket = (server, frontendUrl) => {
  io = socketIo(server, {
    cors: {
      origin: frontendUrl || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`New Socket Client Connected: ${socket.id}`);

    // Join room based on household (userId)
    socket.on('join-household', (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room/household: ${userId}`);
      }
    });

    // Leave room
    socket.on('leave-household', (userId) => {
      if (userId) {
        socket.leave(userId);
        console.log(`Socket ${socket.id} left room/household: ${userId}`);
      }
    });

    // Handle manual disconnect
    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Helper to emit event to a specific household room
 */
const emitToHousehold = (userId, eventName, data) => {
  try {
    const activeIo = getIO();
    activeIo.to(userId).emit(eventName, data);
    console.log(`Socket emit [${eventName}] to household ${userId}`);
  } catch (error) {
    console.error(`Failed to emit socket message: ${error.message}`);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToHousehold,
};
