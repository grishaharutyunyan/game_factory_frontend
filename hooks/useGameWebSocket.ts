"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createWebSocketClient,
  type ConnectionState,
  type GameWebSocketClient,
} from "@/lib/websocket-client";

export type UseGameWebSocketOptions = {
  apiKey: string;
  url?: string;
  namespace?: string;
};

/**
 * Creates the production WebSocket client once; call `connectToSession(sessionId)` to handshake.
 * Matches the pattern in docs/FRONTEND_QUICK_START.md (STEP 3).
 */
export function useGameWebSocket(options: UseGameWebSocketOptions) {
  const { apiKey, url, namespace } = options;
  const [client, setClient] = useState<GameWebSocketClient | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [lastError, setLastError] = useState<{
    code: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    let c: GameWebSocketClient;
    try {
      c = createWebSocketClient({ apiKey, url, namespace });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      queueMicrotask(() =>
        setLastError({ code: "CLIENT_INIT_FAILED", message: msg }),
      );
      return;
    }

    // Client must live in state so dependents re-run when it becomes available (ref alone does not re-render).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount sync
    setClient(c);

    const sync = () => setConnectionState(c.getConnectionState());

    c.socket.on("connect", sync);
    c.socket.on("disconnect", sync);
    c.socket.io.on("reconnect", sync);
    c.socket.io.on("reconnect_attempt", sync);
    c.socket.io.on("reconnect_failed", sync);

    return () => {
      c.socket.off("connect", sync);
      c.socket.off("disconnect", sync);
      c.socket.io.off("reconnect", sync);
      c.socket.io.off("reconnect_attempt", sync);
      c.socket.io.off("reconnect_failed", sync);
      c.disconnect();
      setClient(null);
      setConnectionState("disconnected");
    };
  }, [apiKey, url, namespace]);

  const connectToSession = useCallback(
    async (sessionId: string) => {
      if (!client) {
        throw new Error("WebSocket client not ready");
      }
      setLastError(null);
      setConnectionState("connecting");
      try {
        await client.connect(sessionId);
        setConnectionState(client.getConnectionState());
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const err = { code: "CONNECT_FAILED" as const, message: msg };
        setLastError(err);
        setConnectionState(client.getConnectionState());
        throw e;
      }
    },
    [client],
  );

  return {
    client,
    connectToSession,
    connectionState,
    lastError,
    clearError: () => setLastError(null),
    isConnected: client?.isConnected() ?? false,
  };
}
