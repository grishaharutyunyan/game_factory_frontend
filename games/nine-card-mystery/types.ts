export enum CardType {
    GEM = 'gem',
    BOMB = 'bomb',
    STAR = 'star',
    GIFT = 'gift',
}

export enum GameStatus {
    LOADING = 'loading',
    IDLE = 'idle',
    PLAYING = 'playing',
    FINISHED = 'finished',
}

export interface GameState {
    status: GameStatus;
    balance: number;
    bet: number;
    cards: CardType[]; // Full array of 9 cards (revealed at end)
    selectedIndices: number[];
    roundId: string | null;
    winAmount: number;
    message: string;
    history: GameHistoryItem[];
    timer: number;
    expiresAt?: number;
    error?: string;
    /** Free bet: current round was started with a freebet */
    isFreeBet?: boolean;
    /** Game supports free bet (from game_config) */
    freebetEnabled?: boolean;
    /** How many freebets the user has left (from freebet_status) */
    remainingFreebets?: number;
    /** Eligible grants from freebet_status; send grant id with start_game when using freebet */
    freebetGrants?: FreebetGrant[];
}

/** Single freebet grant from freebet_status; id is sent with start_game so backend finds amount in DB (enforced server-side) */
export interface FreebetGrant {
    id: string;
    amount: number;
    /** Grant expiry (e.g. ISO string or ms). */
    validUntil?: string;
    /** Total freebets in this grant. */
    count?: number;
    remainingCount: number;
}

export interface GameHistoryItem {
    roundId: string;
    result: string;
    winAmount: number;
    timestamp: number;
}

export interface ConnectPayload {
    balance: number;
    userId: string;
    gameId: string;
    config: any;
}

/** Response to get_game_config. freebetEnabled: show "Use freebet" when user has freebets. */
export interface GameConfigPayload {
    gameId?: string;
    gameName?: string;
    minBet?: number;
    maxBet?: number;
    freebetEnabled?: boolean;
}

/** Response to get_freebet_status. Count is per game. */
export interface FreebetStatusPayload {
    remainingFreebets: number;
    /** Eligible grants; send grant id with start_game when using freebet */
    freebetGrants?: FreebetGrant[];
}

export interface GameStartedPayload {
    roundId: string;
    balance: number;
    seedHash?: string;
    expiresAt?: number;
    timer?: number;
    /** true = this round was started with a freebet */
    isFreeBet?: boolean;
}

export interface ActionResultPayload {
    selected: number[];
    canSubmit: boolean;
}

export interface GameResultPayload {
    result: string;
    winAmount: number;
    message: string;
    newBalance: number;
    data: {
        cards: CardType[];
        selected: number[];
        seed: string;
    };
}
