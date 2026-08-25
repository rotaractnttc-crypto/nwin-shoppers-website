import { io } from "socket.io-client";
import { getAccessToken } from "./api";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");

let socket = null;

// Connects once and reuses the same socket across the app. Auth token is
// passed at connect time — since access tokens are short-lived, reconnect()
// should be called again if the user just logged in.
export function connectSocket() {
  const token = getAccessToken();
  if (!token) return null;
  if (socket?.connected && socket.auth?.token === token) return socket;
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
