import { io, type Socket } from "socket.io-client";
import { getApiBase } from "./api.js";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  const url = getApiBase();
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }
  socket = io(url, {
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
