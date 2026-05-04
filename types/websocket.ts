/**
 * Type-safe WebSocket events for the game platform (server ↔ client).
 * Nine Card Mystery uses `game_action` with `{ position }` and `action_result` with `{ selected, canSubmit }`.
 */

import type { Socket } from "socket.io-client";

export type BalanceTypeWs = "REAL" | "BONUS";

export type GameConfig = {
  minBet: number;
  maxBet: number;
  freebetEnabled?: boolean;
} & Record<string, unknown>;

export type FreebetGrantWs = {
  id: string;
  amount: number;
  validUntil?: string;
  count?: number;
  remainingCount: number;
};

/** Server → client */
export type ServerEvents = {
  connected: (data: {
    balance: number;
    realBalance?: number;
    bonusBalance?: number;
    activeBalanceType?: BalanceTypeWs;
    userId?: string;
    gameId?: string;
    config?: GameConfig;
  }) => void;

  round_restored: (data: {
    roundId: string;
    bet: number;
    expiresAt: number;
    isFreeBet: boolean;
    status: string;
    timer?: number;
  }) => void;

  round_auto_resolved: (data: {
    roundId: string;
    result: string;
    message: string;
    newBalance: number;
    realBalance?: number;
    bonusBalance?: number;
    activeBalanceType?: BalanceTypeWs;
  }) => void;

  game_started: (data: {
    roundId: string;
    balance: number;
    realBalance?: number;
    bonusBalance?: number;
    activeBalanceType?: BalanceTypeWs;
    data?: Record<string, unknown>;
    seedHash?: string;
    expiresAt?: number;
    timer?: number;
    isFreeBet?: boolean;
  }) => void;

  /** Nine Card Mystery shape */
  action_result: (data: {
    selected: number[];
    canSubmit: boolean;
    success?: boolean;
    data?: Record<string, unknown>;
  }) => void;

  game_result: (data: {
    result: string;
    winAmount: number;
    message: string;
    newBalance: number;
    realBalance?: number;
    bonusBalance?: number;
    activeBalanceType?: BalanceTypeWs;
    cards?: unknown[];
    selected?: number[];
    seed?: string;
  }) => void;

  balance_switched: (data: {
    activeBalanceType: BalanceTypeWs;
    balance: number;
    realBalance?: number;
    bonusBalance?: number;
  }) => void;

  freebet_status: (data: {
    remainingFreebets: number;
    freebetGrants?: FreebetGrantWs[];
  }) => void;

  game_config: (data: GameConfig) => void;

  error: (data: { code?: string; message: string }) => void;
};

/** Client → server (emit argument tuples for Socket.IO typings) */
export type ClientEvents = {
  start_game: [
    data: {
      bet: number;
      freeBet?: boolean;
      freebetGrantId?: string;
      balanceType?: BalanceTypeWs;
    },
  ];
  /** Nine Card Mystery */
  game_action: [data: { position: number }];
  /** Use explicit undefined so Socket.IO accepts `emit("finish_game")` under strict tuples */
  finish_game: [payload?: void];
  switch_balance: [data: { balanceType: BalanceTypeWs }];
  get_game_config: [payload?: void];
  get_freebet_status: [payload?: void];
  leave_game: [payload?: void];
};

export type WebSocketClientConfig = {
  apiKey: string;
  url?: string;
  namespace?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  /**
   * Max time (ms) to wait for the server to emit the app `connected` event after Socket.IO connects.
   * Default 30s. Override with env `NEXT_PUBLIC_WS_HANDSHAKE_MS` (5000–120000).
   */
  handshakeTimeoutMs?: number;
};

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type WsLastError = { code: string; message: string };

export type GameWebSocketClient = {
  socket: Socket<ServerEvents, ClientEvents>;

  /**
   * Opens the Socket.IO connection with `?session=<sessionId>` (non-secret).
   * API key stays in `auth["x-api-key"]` only. Resolves after the server emits `connected`.
   */
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  isConnected: () => boolean;
  getConnectionState: () => ConnectionState;
  getReconnectAttempt: () => number;

  on: <K extends keyof ServerEvents>(
    event: K,
    handler: ServerEvents[K],
  ) => void;
  off: <K extends keyof ServerEvents>(
    event: K,
    handler?: ServerEvents[K],
  ) => void;
  once: <K extends keyof ServerEvents>(
    event: K,
    handler: ServerEvents[K],
  ) => void;

  startGame: (
    payload: ClientEvents["start_game"][0],
  ) => Promise<void>;
  gameAction: (payload: ClientEvents["game_action"][0]) => Promise<void>;
  finishGame: () => Promise<void>;
  switchBalance: (balanceType: BalanceTypeWs) => Promise<void>;
  getGameConfig: () => Promise<void>;
  getFreebetStatus: () => Promise<void>;
  leaveGame: () => Promise<void>;

  getActiveRoundId: () => string | null;
  getLastError: () => WsLastError | null;
  clearLastError: () => void;
};
