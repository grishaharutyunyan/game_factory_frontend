import { useEffect, useState, useRef, useCallback } from 'react';
import { createWebSocketClient } from '@/lib/websocket-client';
import type { ServerEvents } from '@/types/websocket';
import {
    BalanceType,
    CardType,
    GameStatus,
    GameState,
    GameConfigPayload,
    FreebetStatusPayload,
    FreebetGrant,
} from './types';
import { useGameSound } from './useGameSound';

type ConnectedPayload = Parameters<ServerEvents['connected']>[0];
type GameStartedEvent = Parameters<ServerEvents['game_started']>[0];
type GameResultEvent = Parameters<ServerEvents['game_result']>[0];
type BalanceSwitchedEvent = Parameters<ServerEvents['balance_switched']>[0];

const emptyCards = (): CardType[] => Array(9).fill(null) as unknown as CardType[];

const baseInitialState: GameState = {
    status: GameStatus.LOADING,
    balance: 0,
    realBalance: 0,
    bonusBalance: 0,
    activeBalanceType: BalanceType.REAL,
    bet: 10,
    cards: emptyCards(),
    selectedIndices: [],
    roundId: null,
    winAmount: 0,
    message: '',
    history: [],
    timer: 0,
    expiresAt: 0,
};

function initialGameState(): GameState {
    if (!process.env.NEXT_PUBLIC_GAME_API_KEY) {
        return {
            ...baseInitialState,
            error: 'Game API key is not configured.',
            status: GameStatus.LOADING,
        };
    }
    return { ...baseInitialState };
}

/** Error message shown when server rejects or never accepts the session */
export const INVALID_SESSION_MESSAGE = 'Invalid or expired session. Please open the game again with a valid session link.';

/** Hot reload, tab sleep, or flaky network — not necessarily a bad ?session= id */
const CONNECTION_LOST_MESSAGE =
    'Connection was interrupted (network or reload). Wait a moment and try again, or reopen the game from your lobby with a fresh link.';

function isLikelyNetworkOrReloadDisconnect(reason: string): boolean {
    const r = reason.toLowerCase();
    return (
        r.includes('ping timeout') ||
        r.includes('transport') ||
        r.includes('forced server') ||
        r.includes('forced client') ||
        r.includes('parse error') ||
        r.includes('websocket') ||
        r === 'timeout'
    );
}

function wsBalanceTypeToEnum(v: 'REAL' | 'BONUS' | undefined, fallback: BalanceType): BalanceType {
    if (v === 'BONUS') return BalanceType.BONUS;
    if (v === 'REAL') return BalanceType.REAL;
    return fallback;
}

export const useNineCardGame = (_token: string, sessionId: string) => {
    const [state, setState] = useState<GameState>(initialGameState);
    const clientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null);
    const connectedOnceRef = useRef(false);
    /** Bumps on effect cleanup so deferred connect skips after React Strict Mode's fake unmount. */
    const connectGenRef = useRef(0);
    const { playSound, toggleSound, soundEnabled } = useGameSound();

    useEffect(() => {
        connectedOnceRef.current = false;
        const apiKey = process.env.NEXT_PUBLIC_GAME_API_KEY;
        if (!apiKey) {
            return;
        }

        const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4444';

        let client: ReturnType<typeof createWebSocketClient>;
        try {
            client = createWebSocketClient({ apiKey, url });
        } catch {
            queueMicrotask(() => {
                setState((prev) => ({
                    ...prev,
                    error: 'Failed to initialize WebSocket client.',
                    status: GameStatus.LOADING,
                }));
            });
            return;
        }

        clientRef.current = client;
        const socket = client.socket;

        socket.onAny((event, ...args) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('[EVENT RECEIVED]', event, args);
            }
        });

        const onConnectError = (err: Error) => {
            setState((prev) => ({
                ...prev,
                status: GameStatus.LOADING,
                error: err.message?.toLowerCase().includes('session')
                    ? INVALID_SESSION_MESSAGE
                    : `Connection failed: ${err.message || 'Unknown error'}`,
            }));
        };

        socket.on('connect_error', onConnectError);

        const onDisconnect = (reason: string) => {
            if (connectedOnceRef.current) return;
            // Our own teardown (Strict Mode, unmount, reconnect) — not user-facing.
            if (reason === 'io client disconnect') {
                return;
            }
            // Server closed the socket before `connected` — often invalid session / API key.
            if (reason === 'io server disconnect') {
                setState((prev) => ({
                    ...prev,
                    error: INVALID_SESSION_MESSAGE,
                    status: GameStatus.LOADING,
                }));
                return;
            }
            setState((prev) => ({
                ...prev,
                error: isLikelyNetworkOrReloadDisconnect(reason)
                    ? CONNECTION_LOST_MESSAGE
                    : INVALID_SESSION_MESSAGE,
                status: GameStatus.LOADING,
            }));
        };

        socket.on('disconnect', onDisconnect);

        const onConnected = (data: ConnectedPayload) => {
            connectedOnceRef.current = true;

            const freebetEnabled = !!data.config?.freebetEnabled;

            setState((prev) => ({
                ...prev,
                status: GameStatus.IDLE,
                balance: data.balance,
                realBalance: data.realBalance ?? data.balance,
                bonusBalance: data.bonusBalance ?? 0,
                activeBalanceType: wsBalanceTypeToEnum(data.activeBalanceType, prev.activeBalanceType),
                error: undefined,
                freebetEnabled,
            }));

            if (!data.config) {
                void client.getGameConfig().catch(() => {});
            } else if (freebetEnabled) {
                void client.getFreebetStatus().catch(() => {});
            }
        };

        client.on('connected', onConnected);

        const onGameConfig = (data: GameConfigPayload) => {
            const freebetEnabled = !!data.freebetEnabled;
            setState((prev) => ({ ...prev, freebetEnabled }));
            if (freebetEnabled) void client.getFreebetStatus().catch(() => {});
        };

        client.on('game_config', onGameConfig);

        const onFreebetStatus = (data: FreebetStatusPayload) => {
            setState((prev) => ({
                ...prev,
                remainingFreebets: data.remainingFreebets ?? 0,
                freebetGrants: (data.freebetGrants ?? []) as FreebetGrant[],
            }));
        };

        client.on('freebet_status', onFreebetStatus);

        const onGameStarted = (data: GameStartedEvent) => {
            const expiresAt = data.expiresAt || (Date.now() + (data.timer || 30) * 1000);

            setState((prev) => ({
                ...prev,
                status: GameStatus.PLAYING,
                roundId: data.roundId,
                balance: data.balance,
                realBalance: data.realBalance ?? prev.realBalance,
                bonusBalance: data.bonusBalance ?? prev.bonusBalance,
                activeBalanceType: data.activeBalanceType
                    ? wsBalanceTypeToEnum(data.activeBalanceType, prev.activeBalanceType)
                    : prev.activeBalanceType,
                cards: emptyCards(),
                selectedIndices: [],
                winAmount: 0,
                message: 'Pick 3 cards!',
                timer: data.timer || 30,
                expiresAt,
                isFreeBet: !!data.isFreeBet,
                error: undefined,
            }));
            playSound('start');
        };

        client.on('game_started', onGameStarted);

        const onRoundRestored = (data: Parameters<ServerEvents['round_restored']>[0]) => {
            const expiresAt =
                data.expiresAt || (Date.now() + (data.timer ?? 30) * 1000);

            setState((prev) => ({
                ...prev,
                status: GameStatus.PLAYING,
                roundId: data.roundId,
                bet: data.bet,
                balance: prev.balance,
                cards: emptyCards(),
                selectedIndices: [],
                winAmount: 0,
                message: 'Pick 3 cards!',
                timer: data.timer ?? 30,
                expiresAt,
                isFreeBet: !!data.isFreeBet,
                error: undefined,
            }));
        };

        client.on('round_restored', onRoundRestored);

        const onRoundAutoResolved = (data: Parameters<ServerEvents['round_auto_resolved']>[0]) => {
            setState((prev) => ({
                ...prev,
                status: GameStatus.IDLE,
                roundId: null,
                balance: data.newBalance,
                realBalance: data.realBalance ?? prev.realBalance,
                bonusBalance: data.bonusBalance ?? prev.bonusBalance,
                activeBalanceType: data.activeBalanceType
                    ? wsBalanceTypeToEnum(data.activeBalanceType, prev.activeBalanceType)
                    : prev.activeBalanceType,
                message: data.message,
                error: undefined,
            }));
            playSound('lose');
        };

        client.on('round_auto_resolved', onRoundAutoResolved);

        const onActionResult = (data: { selected: number[]; canSubmit: boolean }) => {
            setState((prev) => ({
                ...prev,
                selectedIndices: data.selected,
            }));

            if (data.canSubmit && data.selected.length === 3) {
                setTimeout(() => {
                    void clientRef.current?.finishGame().catch(() => {});
                }, 500);
            }
        };

        client.on('action_result', onActionResult);

        const onGameResult = (data: GameResultEvent) => {
            const fullCards = (data.cards as CardType[] | undefined) || [];

            setState((prev) => ({
                ...prev,
                status: GameStatus.FINISHED,
                winAmount: data.winAmount,
                message: data.message,
                balance: data.newBalance,
                realBalance: data.realBalance ?? prev.realBalance,
                bonusBalance: data.bonusBalance ?? prev.bonusBalance,
                activeBalanceType: data.activeBalanceType
                    ? wsBalanceTypeToEnum(data.activeBalanceType, prev.activeBalanceType)
                    : prev.activeBalanceType,
                cards: fullCards,
                selectedIndices: (data.selected as number[] | undefined) || prev.selectedIndices,
            }));

            void client.getFreebetStatus().catch(() => {});
            if (data.winAmount > 0) playSound('win');
            else playSound('lose');
        };

        client.on('game_result', onGameResult);

        const onServerError = (err: { code?: string; message: string }) => {
            const msg = err?.message || 'Something went wrong.';
            setState((prev) => ({ ...prev, error: msg, message: msg }));
            playSound('lose');
        };

        client.on('error', onServerError);

        const onBalanceSwitched = (data: BalanceSwitchedEvent) => {
            setState((prev) => ({
                ...prev,
                balance: data.balance,
                realBalance: data.realBalance ?? prev.realBalance,
                bonusBalance: data.bonusBalance ?? prev.bonusBalance,
                activeBalanceType: wsBalanceTypeToEnum(data.activeBalanceType, prev.activeBalanceType),
                error: undefined,
            }));
        };

        client.on('balance_switched', onBalanceSwitched);

        const myConnectGen = ++connectGenRef.current;
        queueMicrotask(() => {
            if (connectGenRef.current !== myConnectGen) return;
            void client.connect(sessionId).catch((err: Error) => {
                setState((prev) => ({
                    ...prev,
                    status: GameStatus.LOADING,
                    error: err.message?.toLowerCase().includes('session')
                        ? INVALID_SESSION_MESSAGE
                        : `Connection failed: ${err.message || 'Unknown error'}`,
                }));
            });
        });

        const sendLeaveAndDisconnect = () => {
            try {
                if (socket.connected) {
                    (socket.emit as (ev: string, ...args: unknown[]) => void)('leave_game');
                }
            } catch {
                // ignore
            }
            socket.disconnect();
        };

        const handlePageUnload = () => {
            sendLeaveAndDisconnect();
        };

        const handleParentMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GAME_CLOSE') {
                sendLeaveAndDisconnect();
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('pagehide', handlePageUnload);
            window.addEventListener('beforeunload', handlePageUnload);
            window.addEventListener('message', handleParentMessage);
        }

        return () => {
            connectGenRef.current += 1;

            if (typeof window !== 'undefined') {
                window.removeEventListener('pagehide', handlePageUnload);
                window.removeEventListener('beforeunload', handlePageUnload);
                window.removeEventListener('message', handleParentMessage);
            }

            socket.off('connect_error', onConnectError);
            socket.off('disconnect', onDisconnect);
            client.off('connected', onConnected);
            client.off('game_config', onGameConfig);
            client.off('freebet_status', onFreebetStatus);
            client.off('game_started', onGameStarted);
            client.off('round_restored', onRoundRestored);
            client.off('round_auto_resolved', onRoundAutoResolved);
            client.off('action_result', onActionResult);
            client.off('game_result', onGameResult);
            client.off('error', onServerError);
            client.off('balance_switched', onBalanceSwitched);

            sendLeaveAndDisconnect();
            clientRef.current = null;
        };
    }, [sessionId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (state.status === GameStatus.PLAYING && state.expiresAt) {
            interval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((state.expiresAt! - now) / 1000));

                setState((prev) => ({ ...prev, timer: remaining }));

                if (remaining <= 0) {
                    setState((prev) => ({ ...prev, message: "Time's up!" }));
                    clearInterval(interval);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [state.status, state.expiresAt]);

    const startGame = useCallback(
        async (useFreeBet?: boolean, balanceType?: BalanceType) => {
            const client = clientRef.current;
            if (!client) return;
            setState((prev) => ({ ...prev, error: undefined, message: '' }));
            const grant = state.freebetGrants?.[0];
            const payload = {
                bet: useFreeBet === true && grant ? grant.amount : state.bet,
                balanceType: (balanceType ?? state.activeBalanceType) as 'REAL' | 'BONUS',
            };
            if (useFreeBet === true && grant) {
                Object.assign(payload, {
                    freeBet: true,
                    freebetGrantId: grant.id,
                });
            }
            try {
                await client.startGame(payload);
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Start game failed.';
                const last = client.getLastError();
                setState((prev) => ({
                    ...prev,
                    error: last?.message ?? msg,
                    message: last?.message ?? msg,
                }));
            }
        },
        [state.bet, state.freebetGrants, state.activeBalanceType],
    );

    const switchBalance = useCallback(async (balanceType: BalanceType) => {
        const client = clientRef.current;
        if (!client) return;
        setState((prev) => ({ ...prev, error: undefined, message: '' }));
        try {
            await client.switchBalance(balanceType === BalanceType.BONUS ? 'BONUS' : 'REAL');
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Switch balance failed.';
            const last = client.getLastError();
            setState((prev) => ({
                ...prev,
                error: last?.message ?? msg,
            }));
        }
    }, []);

    const selectCard = useCallback(
        async (index: number) => {
            const client = clientRef.current;
            if (!client || state.status !== GameStatus.PLAYING) return;
            if (state.selectedIndices.includes(index)) return;
            if (state.selectedIndices.length >= 3) return;

            playSound('click');
            try {
                await client.gameAction({ position: index });
            } catch {
                // No active round or disconnected; ignore click
            }
        },
        [state.status, state.selectedIndices, playSound],
    );

    const setBet = useCallback((amount: number) => {
        setState((prev) => ({ ...prev, bet: amount, error: undefined }));
    }, []);

    const reset = useCallback(() => {
        setState((prev) => ({
            ...prev,
            status: GameStatus.IDLE,
            message: '',
            error: undefined,
            isFreeBet: false,
        }));
        void clientRef.current?.getFreebetStatus().catch(() => {});
    }, []);

    const closeGame = useCallback(() => {
        try {
            clientRef.current?.disconnect();
        } catch {
            // ignore
        }
        if (typeof window === 'undefined') return;

        // Embedded: parent is expected to remove the iframe / shell.
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'GAME_CLOSE' }, '*');
            return;
        }

        // Popups opened via window.open() may close; normal tabs ignore close().
        window.close();

        // Universal fallback when the tab stays open (most direct visits).
        queueMicrotask(() => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.assign('/');
            }
        });
    }, []);

    return {
        state,
        startGame,
        switchBalance,
        selectCard,
        setBet,
        reset,
        closeGame,
        soundEnabled,
        toggleSound,
    };
};
