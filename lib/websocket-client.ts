"use client";

import {io, Socket} from "socket.io-client";
import type {
  ClientEvents,
  ConnectionState,
  GameWebSocketClient,
  ServerEvents,
  WebSocketClientConfig,
  WsLastError,
} from "@/types/websocket";

const HANDSHAKE_MS_MIN = 5_000;
const HANDSHAKE_MS_MAX = 120_000;
const HANDSHAKE_MS_DEFAULT = 30_000;

function resolveHandshakeTimeoutMs(config: WebSocketClientConfig): number {
  if (
    typeof config.handshakeTimeoutMs === "number" &&
    Number.isFinite(config.handshakeTimeoutMs) &&
    config.handshakeTimeoutMs >= HANDSHAKE_MS_MIN
  ) {
    return Math.min(config.handshakeTimeoutMs, HANDSHAKE_MS_MAX);
  }
  const raw = process.env.NEXT_PUBLIC_WS_HANDSHAKE_MS;
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= HANDSHAKE_MS_MIN) {
      return Math.min(n, HANDSHAKE_MS_MAX);
    }
  }
  return HANDSHAKE_MS_DEFAULT;
}

/** Socket.IO strict emit tuples reject zero-arg events in some TS versions; use loose emit for known events. */
function emitLoose(
  socket: Socket<ServerEvents, ClientEvents>,
  event: string,
  ...args: unknown[]
): void {
  const fn = socket.emit.bind(socket) as (
    ev: string,
    ...rest: unknown[]
  ) => void;
  fn(event, ...args);
}

/**
 * Fire-and-forget emit wrapped in Promise so callers can `await` without blocking.
 * Validation / failures are expected on the `error` event and game-specific server events.
 */
function emitGame(
  socket: Socket<ServerEvents, ClientEvents>,
  event: keyof ClientEvents,
  payload?: unknown,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error("Socket not connected"));
      return;
    }
    if (payload === undefined) {
      emitLoose(socket, event as string);
    } else {
      emitLoose(socket, event as string, payload);
    }
    queueMicrotask(() => resolve());
  });
}

export function createWebSocketClient(
  config: WebSocketClientConfig,
): GameWebSocketClient {
  const {
    apiKey,
    url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "",
    namespace,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
  } = config;

  if (!apiKey) {
    throw new Error("createWebSocketClient: apiKey is required");
  }

  if (!url) {
    throw new Error(
      "createWebSocketClient: url is required (or set NEXT_PUBLIC_SOCKET_URL)",
    );
  }

  const fullUrl = namespace ? `${url.replace(/\/$/, "")}/${namespace}` : url;
  const handshakeTimeoutMs = resolveHandshakeTimeoutMs(config);

  let connectionState: ConnectionState = "disconnected";
  let reconnectAttempts = 0;
  let activeRoundId: string | null = null;
  let lastError: WsLastError | null = null;

  const socket: Socket<ServerEvents, ClientEvents> = io(fullUrl, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: autoReconnect,
    reconnectionDelay: reconnectDelay,
    reconnectionDelayMax: 10_000,
    reconnectionAttempts: maxReconnectAttempts,
    auth: {
      "x-api-key": apiKey,
    },
  });

  socket.on("connect", () => {
    connectionState = "connected";
    reconnectAttempts = 0;
  });

  socket.on("disconnect", (reason) => {
    connectionState = "disconnected";
    activeRoundId = null;
    if (reason === "io server disconnect" || reason === "io client disconnect") {
      return;
    }
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    reconnectAttempts = attempt;
    connectionState = "reconnecting";
  });

  socket.io.on("reconnect", () => {
    connectionState = "connected";
    reconnectAttempts = 0;
  });

  socket.io.on("reconnect_failed", () => {
    connectionState = "error";
    lastError = {
      code: "RECONNECT_FAILED",
      message: "Could not reconnect to the game server.",
    };
  });

  socket.on("connect_error", (error) => {
    connectionState = "error";
    lastError = {
      code: "CONNECTION_ERROR",
      message: error.message || "Failed to connect",
    };
  });

  socket.on("error", (data) => {
    lastError = {
      code: data.code ?? "SERVER_ERROR",
      message: data.message || "Server error",
    };
  });

  socket.on("round_auto_resolved", () => {
    activeRoundId = null;
  });

  socket.on("round_restored", (data) => {
    activeRoundId = data.roundId;
  });

  socket.on("game_started", (data) => {
    activeRoundId = data.roundId;
  });

  socket.on("game_result", () => {
    activeRoundId = null;
  });

  return {
    socket,

    connect: async (sessionId: string) => {
      connectionState = "connecting";
      lastError = null;

      socket.io.opts.query = {
        session: sessionId,
      };

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.off("connected", onHandshake);
          socket.off("connect_error", onConnectError);
          connectionState = "error";
          const secs = Math.round(handshakeTimeoutMs / 1000);
          const msg = `Connection timeout after ${secs}s (no server 'connected' event)`;
          lastError = {
            code: "CONNECT_TIMEOUT",
            message: msg,
          };
          socket.disconnect();
          reject(new Error(msg));
        }, handshakeTimeoutMs);

        const cleanup = () => {
          clearTimeout(timeout);
          socket.off("connected", onHandshake);
          socket.off("connect_error", onConnectError);
        };

        const onHandshake = () => {
          cleanup();
          connectionState = "connected";
          resolve();
        };

        const onConnectError = (err: Error) => {
          cleanup();
          connectionState = "error";
          lastError = {
            code: "CONNECTION_ERROR",
            message: err.message || "Failed to connect",
          };
          reject(err);
        };

        socket.once("connected", onHandshake);
        socket.once("connect_error", onConnectError);

        if (!socket.connected) {
          socket.connect();
        } else {
          socket.disconnect();
          socket.connect();
        }
      });
    },

    disconnect: () => {
      try {
        if (socket.connected) {
          emitLoose(socket, "leave_game");
        }
      } catch {
        // ignore
      }
      socket.disconnect();
      connectionState = "disconnected";
      activeRoundId = null;
    },

    isConnected: () => socket.connected,

    getConnectionState: () => connectionState,

    getReconnectAttempt: () => reconnectAttempts,

    on: (event, handler) => {
      socket.on(event, handler as never);
    },

    off: (event, handler) => {
      if (handler) {
        socket.off(event, handler as never);
      } else {
        socket.off(event);
      }
    },

    once: (event, handler) => {
      socket.once(event, handler as never);
    },

    startGame: async (payload) => {
      try {
        await emitGame(socket, "start_game", payload);
      } catch (error) {
        lastError = {
          code: "START_GAME_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        };
        throw error;
      }
    },

    gameAction: async (payload) => {
      if (!activeRoundId) {
        const err = new Error("No active game round");
        lastError = {code: "GAME_ACTION_FAILED", message: err.message};
        throw err;
      }
      try {
        await emitGame(socket, "game_action", payload);
      } catch (error) {
        lastError = {
          code: "GAME_ACTION_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        };
        throw error;
      }
    },

    finishGame: async () => {
      if (!activeRoundId) {
        const err = new Error("No active game round");
        lastError = {code: "FINISH_GAME_FAILED", message: err.message};
        throw err;
      }
      try {
        await emitGame(socket, "finish_game", undefined);
        activeRoundId = null;
      } catch (error) {
        lastError = {
          code: "FINISH_GAME_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        };
        throw error;
      }
    },

    switchBalance: async (balanceType) => {
      try {
        await emitGame(socket, "switch_balance", {
          balanceType,
        });
      } catch (error) {
        lastError = {
          code: "SWITCH_BALANCE_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        };
        throw error;
      }
    },

    getGameConfig: async () => {
      try {
        await emitGame(socket, "get_game_config", undefined);
      } catch (error) {
        lastError = {
          code: "GET_CONFIG_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        };
        throw error;
      }
    },

    getFreebetStatus: async () => {
      try {
        await emitGame(socket, "get_freebet_status", undefined);
      } catch (error) {
        lastError = {
          code: "GET_FREEBET_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        };
        throw error;
      }
    },

    leaveGame: async () => {
      try {
        await emitGame(socket, "leave_game", undefined);
      } catch {
        // non-fatal on teardown
      } finally {
        activeRoundId = null;
      }
    },

    getActiveRoundId: () => activeRoundId,

    getLastError: () => lastError,

    clearLastError: () => {
      lastError = null;
    },
  };
}

export type { ConnectionState, GameWebSocketClient };
