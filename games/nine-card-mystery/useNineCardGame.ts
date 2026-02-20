import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CardType, GameStatus, GameState, GameConfigPayload, FreebetStatusPayload, GameStartedPayload } from './types';
import { useGameSound } from './useGameSound';

// Default initial state
const initialState: GameState = {
    status: GameStatus.LOADING,
    balance: 0,
    bet: 10,
    cards: Array(9).fill(null) as any, // Initially unknown
    selectedIndices: [],
    roundId: null,
    winAmount: 0,
    message: '',
    history: [],
    timer: 0,
    expiresAt: 0,
};

/** Error message shown when server rejects or never accepts the session */
export const INVALID_SESSION_MESSAGE = 'Invalid or expired session. Please open the game again with a valid session link.';

export const useNineCardGame = (token: string, sessionId: string) => {
    const [state, setState] = useState<GameState>(initialState);
    const socketRef = useRef<Socket | null>(null);
    const connectedOnceRef = useRef(false);
    const { playSound, toggleSound, soundEnabled } = useGameSound();

    useEffect(() => {
        connectedOnceRef.current = false;
        const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4444';
        const apiKey = process.env.NEXT_PUBLIC_GAME_API_KEY;

        if (!apiKey) {
            setState(prev => ({ ...prev, error: 'Game API key is not configured.', status: GameStatus.LOADING }));
            return;
        }

        // Connect with auth and query.session
        // Backend WsAuthGuard checks query['apiKey'] or query['x-api-key'] or headers
        const socket = io(url, {
            transports: ['websocket'],
            auth: {
                apiKey: apiKey,
            },
            query: {
                session: sessionId,
                apiKey: apiKey,
            },
            extraHeaders: {
                "x-api-key": apiKey || "",
            }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            // Connection established; server may still reject session via disconnect/error
        });
        socket.onAny((event, ...args) => {
            if (process.env.NODE_ENV === 'development') {
                console.log("[EVENT RECEIVED]", event, args);
            }
        });

        socket.on('connect_error', (err) => {
            setState(prev => ({
                ...prev,
                status: GameStatus.LOADING,
                error: err.message?.toLowerCase().includes('session') ? INVALID_SESSION_MESSAGE : `Connection failed: ${err.message || 'Unknown error'}`,
            }));
        });

        socket.on('disconnect', (reason) => {
            if (connectedOnceRef.current) return;
            setState(prev => ({
                ...prev,
                error: reason === 'io server disconnect' || reason === 'io client disconnect'
                    ? prev.error
                    : INVALID_SESSION_MESSAGE,
                status: GameStatus.LOADING,
            }));
        });

        socket.on('connected', (data: { balance: number, config?: any }) => {
            connectedOnceRef.current = true;

            // Extract freebet config if available
            let freebetEnabled = false;
            if (data.config) {
                freebetEnabled = !!data.config.freebetEnabled;
            }

            setState(prev => ({
                ...prev,
                status: GameStatus.IDLE,
                balance: data.balance,
                error: undefined,
                freebetEnabled
            }));

            // If config wasn't in connected (or just to be safe/synchronize), we *could* still ask,
            // but the spec says "Option A: ... Use config.freebetEnabled from there."
            // "Option B: ... socket.emit('get_game_config')"
            // We'll stick to: if we got it, great. If not, maybe ask? 
            // For now, let's keep the get_game_config call as a fallback or for refresh, 
            // but we can rely on the data.config if present.
            // Actually, to be robust: if we didn't get config, ask for it.
            if (!data.config) {
                socket.emit('get_game_config');
            } else if (freebetEnabled) {
                // If we got config and it's enabled, immediately fetch status
                socket.emit('get_freebet_status');
            }
        });

        socket.on('game_config', (data: GameConfigPayload) => {
            const freebetEnabled = !!data.freebetEnabled;
            setState(prev => ({ ...prev, freebetEnabled }));
            if (freebetEnabled) socket.emit('get_freebet_status');
        });

        socket.on('freebet_status', (data: FreebetStatusPayload) => {
            setState(prev => ({
                ...prev,
                remainingFreebets: data.remainingFreebets ?? 0,
                freebetGrants: data.freebetGrants ?? [],
            }));
        });

        socket.on('game_started', (data: GameStartedPayload) => {
            const expiresAt = data.expiresAt || (Date.now() + (data.timer || 30) * 1000);

            setState(prev => ({
                ...prev,
                status: GameStatus.PLAYING,
                roundId: data.roundId,
                balance: data.balance,
                cards: Array(9).fill(null) as any, // Reset cards
                selectedIndices: [],
                winAmount: 0,
                message: 'Pick 3 cards!',
                timer: data.timer || 30,
                expiresAt: expiresAt,
                isFreeBet: !!data.isFreeBet,
                error: undefined,
            }));
            playSound('start'); // Play start sound
        });

        socket.on('action_result', (data: { selected: number[], canSubmit: boolean }) => {
            setState(prev => ({
                ...prev,
                selectedIndices: data.selected,
            }));

            // Auto-finish if 3 selected? 
            // Backend: logic says "processAction" updates implementation. 
            // If we have 3, we usually trigger finish or backend might.
            // Looking at backend: "processAction" just updates selection. 
            // User must call "finish_game" to end it? 
            // User code: "@SubscribeMessage('finish_game')" exists.

            if (data.canSubmit && data.selected.length === 3) {
                // Automatically finish for smoother UX or let user click?
                // Let's auto-finish after short delay for effect
                setTimeout(() => {
                    socket.emit('finish_game');
                }, 500);
            }
        });

        socket.on('game_result', (data: any) => {
            // data contains full results directly (backend spreads result.data)
            const fullCards = data.cards || [];

            setState(prev => ({
                ...prev,
                status: GameStatus.FINISHED,
                winAmount: data.winAmount,
                message: data.message,
                balance: data.newBalance,
                cards: fullCards,
                selectedIndices: data.selected || prev.selectedIndices,
            }));

            // Refresh freebet count after round (if freebet was used)
            socket.emit('get_freebet_status');
            if (data.winAmount > 0) playSound('win');
            else playSound('lose'); // Use lose sound for all losses (bomb or otherwise)
        });

        socket.on('error', (err: { message: string }) => {
            const msg = err?.message || 'Something went wrong.';
            setState(prev => ({ ...prev, error: msg, message: msg }));
            playSound('lose');
        });

        return () => {
            socket.disconnect();
        };
    }, [token, sessionId, playSound]);

    // Timer countdown effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (state.status === GameStatus.PLAYING && state.expiresAt) {
            interval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((state.expiresAt! - now) / 1000));

                setState(prev => ({ ...prev, timer: remaining }));

                if (remaining <= 0) {
                    setState(prev => ({ ...prev, message: "Time's up!" }));
                    clearInterval(interval);
                    // Optionally auto-finish or let user click to finish (if backend allows grace period)
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [state.status, state.expiresAt]);

    const startGame = useCallback((useFreeBet?: boolean) => {
        if (!socketRef.current) return;
        // Clear previous errors
        setState(prev => ({ ...prev, error: undefined, message: '' }));
        const grant = state.freebetGrants?.[0];
        const payload: { bet: number; freeBet?: boolean; freebetGrantId?: string } = {
            bet: useFreeBet === true && grant ? grant.amount : state.bet,
        };
        if (useFreeBet === true && grant) {
            payload.freeBet = true;
            payload.freebetGrantId = grant.id;
            // Backend requires bet to equal grant.amount from DB; we send grant.amount
        }
        socketRef.current.emit('start_game', payload);
    }, [state.bet, state.freebetGrants]);

    const selectCard = useCallback((index: number) => {
        if (!socketRef.current || state.status !== GameStatus.PLAYING) return;
        if (state.selectedIndices.includes(index)) return; // Already selected
        if (state.selectedIndices.length >= 3) return; // Max 3

        playSound('click');
        socketRef.current.emit('game_action', { position: index });
    }, [state.status, state.selectedIndices, playSound]);

    const setBet = useCallback((amount: number) => {
        setState(prev => ({ ...prev, bet: amount, error: undefined }));
    }, []);

    const reset = useCallback(() => {
        setState(prev => ({ ...prev, status: GameStatus.IDLE, message: '', error: undefined, isFreeBet: false }));
        // Refresh freebet count when user returns to bet screen (spec §5)
        if (socketRef.current) socketRef.current.emit('get_freebet_status');
    }, []);

    return {
        state,
        startGame,
        selectCard,
        setBet,
        reset,
        soundEnabled,
        toggleSound,
    };
};
