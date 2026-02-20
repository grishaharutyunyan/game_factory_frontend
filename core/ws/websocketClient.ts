"use client";

import { io, Socket } from "socket.io-client";

export type WebSocketClientConfig = {
  /**
   * Public API key used for authorization.
   * Sent as `x-api-key` in the Socket.IO auth payload (readable on the server as `socket.handshake.auth["x-api-key"]`).
   * Typically comes from your game's configuration or env.
   */
  apiKey: string;
  /**
   * Base URL of your WebSocket / Socket.IO server.
   * If omitted, falls back to NEXT_PUBLIC_SOCKET_URL.
   */
  url?: string;
  /**
   * Optional namespace/room path, e.g. "tetris" or "pong".
   * Will be appended to the base URL.
   */
  namespace?: string;
};

export type GameWebSocketClient = {
  /** Underlying Socket.IO instance (use carefully). */
  socket: Socket;
  /** Manually start the connection (autoConnect is disabled by default). */
  connect: () => void;
  /** Gracefully close the connection. */
  disconnect: () => void;
  /** Add event listener. */
  on: Socket["on"];
  /** Remove event listener. */
  off: Socket["off"];
  /** Emit events with payload. */
  emit: Socket["emit"];
};

/**
 * Factory that creates an authorized WebSocket client for games.
 *
 * Usage example in a game module:
 *
 * ```ts
 * const client = createWebSocketClient({
 *   apiKey: "<game-or-player-api-key>",
 *   namespace: "my-game",
 * });
 *
 * client.connect();
 * client.on("state", (state) => {
 *   // handle game state update
 * });
 * ```
 */
export function createWebSocketClient(
  config: WebSocketClientConfig
): GameWebSocketClient {
  const {
    apiKey,
    url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "",
    namespace,
  } = config;

  if (!apiKey) {
    throw new Error("createWebSocketClient: apiKey is required");
  }

  if (!url) {
    throw new Error(
      "createWebSocketClient: url is required (or set NEXT_PUBLIC_SOCKET_URL)"
    );
  }

  const fullUrl = namespace ? `${url.replace(/\/$/, "")}/${namespace}` : url;

  const socket = io(fullUrl, {
    autoConnect: false,
    transports: ["websocket"],
    auth: {
      "x-api-key": apiKey,
    },
  });

  return {
    socket,
    connect: () => {
      if (!socket.connected) {
        socket.connect();
      }
    },
    disconnect: () => {
      if (socket.connected) {
        socket.disconnect();
      }
    },
    on: socket.on.bind(socket),
    off: socket.off.bind(socket),
    emit: socket.emit.bind(socket),
  };
}

