import { Server } from "socket.io";
import http from "http";

let io: Server | null = null;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log('[Socket] New connection:', socket.id);
    console.log('[Socket] Total connected sockets:', io?.engine.clientsCount);

    socket.on("register", (userId: string) => {
      if (!userId) {
        console.log('[Socket] Register called with empty userId');
        return;
      }
      
      console.log('[Socket] Register event received');
      console.log('[Socket] userId type:', typeof userId);
      console.log('[Socket] userId value:', userId);
      console.log('[Socket] userId.toString():', userId.toString());
      
      socket.join(userId.toString());
      socket.data.userId = userId.toString();
      
      console.log('[Socket] User registered in room:', userId.toString());
      console.log('[Socket] Socket ID:', socket.id);
      console.log('[Socket] Socket rooms:', socket.rooms);
      console.log('[Socket] Total sockets in room "' + userId.toString() + '":', io?.sockets.adapter.rooms.get(userId.toString())?.size);
    });

    socket.on("disconnect", () => {
      console.log('[Socket] User disconnected:', socket.id);
      if (socket.data.userId) {
        console.log('[Socket] Disconnected userId:', socket.data.userId);
      }
    });
  });

  console.log('[Socket] Socket.io initialized');
  return io;
};

export const getIo = () => {
  if (!io) {
    console.warn("[Socket] Socket.io not initialized (running in test environment?)");
    return null;
  }
  return io;
};
