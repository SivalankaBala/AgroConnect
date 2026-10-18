import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";

let socket = null;

export function getSocketUrl() {
  if (API_BASE_URL) return API_BASE_URL;
  if (typeof window !== "undefined") {
    // When Vite dev server runs on 5173, backend is on 5000
    if (window.location.port === "5173" || window.location.port === "5174") {
      return "http://localhost:5000";
    }
    return window.location.origin;
  }
  return "http://localhost:5000";
}

export function connectChatSocket(token) {
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  // If socket exists but disconnected or token changed, recreate
  if (socket) {
    socket.disconnect();
  }

  const socketUrl = getSocketUrl();

  socket = io(socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000
  });

  socket.on("connect", () => {
    // Socket successfully connected
  });

  socket.on("connect_error", (err) => {
    console.warn("Chat Socket connection notice:", err.message);
  });

  return socket;
}

export function getChatSocket() {
  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
