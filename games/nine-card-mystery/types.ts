export enum CardType {
    GEM = 'gem',
    STAR = 'star',
    CRYSTAL = 'crystal',
}

export enum GameStatus {
    LOADING = 'loading',
    IDLE = 'idle',
    PLAYING = 'playing',
    FINISHED = 'finished',
}

export enum BalanceType {
    REAL = 'REAL',
    BONUS = 'BONUS',
}

export interface GameState {
    status: GameStatus;
    balance: number;
    realBalance: number;
    bonusBalance: number;
    activeBalanceType: BalanceType;
    bet: number;
    minBet?: number;
    maxBet?: number;
    cards: CardType[];
    selectedIndices: number[];
    roundId: string | null;
    winAmount: number;
    result?: 'win' | 'lose';
    message: string;
    timer: number;
    expiresAt?: number;
    error?: string;
    isFreeBet?: boolean;
    freebetEnabled?: boolean;
    remainingFreebets?: number;
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

export interface ConnectPayload {
    balance: number;
    realBalance?: number;
    bonusBalance?: number;
    activeBalanceType?: BalanceType;
    userId: string;
    gameId: string;
    config: never;
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
    realBalance?: number;
    bonusBalance?: number;
    activeBalanceType?: BalanceType;
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
    result: 'win' | 'lose';
    winAmount: number;
    newBalance: number;
    realBalance?: number;
    bonusBalance?: number;
    activeBalanceType?: BalanceType;
    data: {
        cards: CardType[];
        selected: number[];
        seed: string;
    };
}

export interface BalanceSwitchedPayload {
    balance: number;
    realBalance: number;
    bonusBalance: number;
    activeBalanceType: BalanceType;
}
