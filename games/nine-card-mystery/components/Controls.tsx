import React from 'react';
import { BalanceType, GameStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingUp, Sparkles, Play, Volume2, VolumeX, Info, Gift } from 'lucide-react';
import { Timer } from './Timer';
import type { FreebetGrant } from '../types';

interface ControlsProps {
    bet: number;
    setBet: (amount: number) => void;
    onStart: (useFreebet?: boolean) => void;
    status: GameStatus;
    balance: number;
    realBalance?: number;
    bonusBalance?: number;
    activeBalanceType?: BalanceType;
    onSwitchBalance?: (type: BalanceType) => void;
    message: string;
    winAmount: number;
    error?: string;
    soundEnabled?: boolean;
    toggleSound?: () => void;
    setShowPayouts?: (show: boolean) => void;
    timer?: number;
    isFreeBet?: boolean;
    freebetEnabled?: boolean;
    remainingFreebets?: number;
    freebetGrant?: FreebetGrant;
    minBet?: number;
    maxBet?: number;
}

const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);

export const Controls: React.FC<ControlsProps> = ({
    bet, setBet, onStart, status, balance, realBalance = 0, bonusBalance = 0, activeBalanceType = BalanceType.REAL, onSwitchBalance, message, winAmount, error,
    soundEnabled, toggleSound, setShowPayouts, timer = 30,
    isFreeBet, freebetEnabled, remainingFreebets = 0, freebetGrant, minBet, maxBet,
}) => {
    const betOptions = [10, 50, 100, 500, 1000];
    const [showMobileBet, setShowMobileBet] = React.useState(false);

    const betTooLow = minBet !== undefined && bet < minBet;
    const betTooHigh = maxBet !== undefined && bet > maxBet;
    const betOutOfRange = betTooLow || betTooHigh;

    const canPlayFreebet =
        !!freebetEnabled &&
        !!freebetGrant &&
        ((remainingFreebets > 0) || (freebetGrant.remainingCount ?? 0) > 0);

    const startNextRound = () => onStart(canPlayFreebet);
    const isLocked = status === GameStatus.PLAYING || status === GameStatus.LOADING;
    const canClickPlay =
        !isLocked &&
        (canPlayFreebet || (bet <= balance && !betOutOfRange));

    /* ── Desktop panel ─────────────────────────────────────────── */
    const DesktopContent = (
        <div className="flex flex-col w-full max-w-md gap-6 p-8 bg-linear-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 rounded-3xl border-2 border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(100,116,139,0.05)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-rose-500/5 via-transparent to-pink-500/5 pointer-events-none" />
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-slate-600/40 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-slate-600/40 rounded-br-3xl" />

            {/* Balance */}
            <motion.div
                className="relative bg-linear-to-br from-slate-800/80 via-slate-700/60 to-slate-800/80 p-5 rounded-2xl border-2 border-slate-600/40 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(100,116,139,0.08)] backdrop-blur-sm overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-500/20 rounded-xl border border-green-400/30">
                            <Coins className="w-6 h-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Balance</span>
                            <span className="text-2xl font-mono font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]">
                                {balance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    {winAmount > 0 && (
                        <motion.div
                            className="flex items-center gap-2 bg-yellow-500/20 px-3 py-2 rounded-xl border border-yellow-400/30"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <TrendingUp className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-bold text-sm">+{winAmount.toFixed(2)}</span>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Balance switcher */}
            <div className="grid grid-cols-2 gap-2">
                <motion.button
                    onClick={() => onSwitchBalance?.(BalanceType.REAL)}
                    disabled={isLocked || !onSwitchBalance}
                    className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        ${activeBalanceType === BalanceType.REAL
                            ? 'bg-linear-to-br from-rose-600 to-rose-700 text-white border-rose-400/60'
                            : 'bg-slate-800/60 text-slate-300 border-slate-600/40 hover:border-slate-500/60'
                        }`}
                    whileHover={!isLocked ? { scale: 1.02 } : {}}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                >
                    REAL ({realBalance.toFixed(2)})
                </motion.button>
                <motion.button
                    onClick={() => onSwitchBalance?.(BalanceType.BONUS)}
                    disabled={isLocked || !onSwitchBalance}
                    className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        ${activeBalanceType === BalanceType.BONUS
                            ? 'bg-linear-to-br from-pink-600 to-pink-700 text-white border-pink-400/60'
                            : 'bg-slate-800/60 text-slate-300 border-slate-600/40 hover:border-slate-500/60'
                        }`}
                    whileHover={!isLocked ? { scale: 1.02 } : {}}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                >
                    BONUS ({bonusBalance.toFixed(2)})
                </motion.button>
            </div>

            {/* Free bet notice */}
            {canPlayFreebet && status === GameStatus.IDLE && (
                <motion.div
                    className="relative overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-950/50 via-amber-900/30 to-amber-950/50 p-4 shadow-[0_0_24px_rgba(251,191,36,0.15)]"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent pointer-events-none" />
                    <div className="relative flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15">
                            <Gift className="h-5 w-5 text-amber-300" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-200/90">Free bet active</p>
                            <p className="text-sm text-amber-100/90">
                                <span className="font-semibold text-amber-200">Play below uses your free bet</span>
                                {' — '}
                                {freebetGrant.amount.toFixed(2)} stake
                                {remainingFreebets > 1 ? ` · ${remainingFreebets} left` : ''}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Status message */}
            <motion.div
                className={`min-h-[60px] flex flex-col items-center justify-center text-center font-bold text-lg px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all
                    ${error
                        ? 'bg-red-950/40 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : winAmount > 0
                            ? 'bg-yellow-950/40 border-yellow-400/50 text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                            : 'bg-slate-800/40 border-slate-600/40 text-slate-200'
                    }`}
                animate={error ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.5, repeat: error ? Infinity : 0 }}
            >
                {status === GameStatus.PLAYING && isFreeBet && (
                    <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-0.5 text-xs font-black uppercase tracking-widest text-amber-300">
                        <Gift className="h-3.5 w-3.5" />Free bet round
                    </span>
                )}
                {error || message || (status === GameStatus.IDLE ? 'Ready to Play' : 'Pick 3 Cards')}
            </motion.div>

            {/* Bet controls */}
            <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <label className="text-slate-300 text-sm uppercase font-bold tracking-wider">Bet Amount</label>
                    {minBet !== undefined && maxBet !== undefined && (
                        <span className="text-slate-500 text-xs ml-auto">{minBet} – {maxBet}</span>
                    )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {betOptions.map(amount => (
                        <motion.button
                            key={amount}
                            onClick={() => setBet(amount)}
                            disabled={isLocked}
                            className={`relative px-3 py-3 text-sm rounded-xl font-bold transition-all overflow-hidden border-2 disabled:opacity-40 disabled:cursor-not-allowed
                                ${bet === amount
                                    ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                                    : 'bg-gradient-to-br from-slate-700/60 to-slate-800/60 text-slate-300 border-slate-600/40 hover:border-slate-500/60'
                                }`}
                            whileHover={!isLocked ? { scale: 1.05, y: -2 } : {}}
                            whileTap={!isLocked ? { scale: 0.95 } : {}}
                        >
                            {bet === amount && (
                                <motion.div
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                                />
                            )}
                            <span className="relative z-10">{fmt(amount)}</span>
                        </motion.button>
                    ))}
                </div>
                <div className="relative">
                    <input
                        type="number"
                        value={bet}
                        onChange={(e) => setBet(Number(e.target.value))}
                        disabled={isLocked}
                        className="w-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-slate-600/40 rounded-xl py-4 px-4 text-white text-lg font-mono font-bold focus:outline-none focus:border-rose-500/60 focus:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all backdrop-blur-sm disabled:opacity-40"
                        placeholder="Custom amount"
                    />
                </div>
            </div>

            {/* Play button */}
            <motion.button
                type="button"
                onClick={startNextRound}
                disabled={!canClickPlay}
                className={`relative w-full py-5 rounded-xl font-black text-lg uppercase tracking-widest transition-all overflow-hidden border-2
                    ${!canClickPlay
                        ? 'bg-gradient-to-br from-slate-700/60 to-slate-800/60 text-slate-500 cursor-not-allowed border-slate-600/40'
                        : canPlayFreebet
                            ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-amber-950 shadow-[0_0_30px_rgba(251,191,36,0.45)] border-amber-300/80'
                            : 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] border-rose-400/60'
                    }`}
                whileHover={canClickPlay ? { scale: 1.02, y: -2 } : {}}
                whileTap={canClickPlay ? { scale: 0.98 } : {}}
            >
                {canClickPlay && status === GameStatus.IDLE && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                )}
                <span className="relative z-10 flex items-center justify-center gap-3">
                    {status === GameStatus.LOADING ? (
                        <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <Sparkles className="w-5 h-5" />
                            </motion.div>
                            Connecting…
                        </>
                    ) : status === GameStatus.PLAYING ? (
                        'Game in Progress'
                    ) : canPlayFreebet ? (
                        <><Gift className="w-5 h-5" />Play — free bet</>
                    ) : (
                        <><Play className="w-5 h-5 fill-current" />Start Game</>
                    )}
                </span>
            </motion.button>

            <AnimatePresence>
                {!canPlayFreebet && bet > balance && (
                    <motion.p className="text-red-400 text-sm text-center font-semibold -mt-2"
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        Insufficient balance
                    </motion.p>
                )}
                {!canPlayFreebet && betTooLow && (
                    <motion.p className="text-yellow-400 text-sm text-center font-semibold -mt-2"
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        Minimum bet is {minBet}
                    </motion.p>
                )}
                {!canPlayFreebet && betTooHigh && (
                    <motion.p className="text-yellow-400 text-sm text-center font-semibold -mt-2"
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        Maximum bet is {maxBet}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );

    /* ── Mobile bottom bar ─────────────────────────────────────── */
    const MobileContent = (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-linear-to-t from-slate-950 via-slate-900/95 to-transparent">

            {status === GameStatus.PLAYING && isFreeBet && (
                <div className="mb-2 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/45 bg-amber-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
                        <Gift className="h-3.5 w-3.5" />
                        Free bet round
                    </span>
                </div>
            )}

            {/* Bet popover */}
            <AnimatePresence>
                {showMobileBet && (
                    <motion.div
                        className="absolute bottom-full left-0 right-0 mb-2 px-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 shadow-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-300 text-sm font-bold uppercase tracking-wider">Bet Amount</span>
                                <button onClick={() => setShowMobileBet(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>
                            <div className="grid grid-cols-5 gap-2 mb-3">
                                {betOptions.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => { setBet(amount); setShowMobileBet(false); }}
                                        className={`py-2 rounded-lg text-xs font-bold ${bet === amount ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                                    >
                                        {fmt(amount)}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                value={bet}
                                onChange={(e) => setBet(Number(e.target.value))}
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-2 px-3 text-white font-mono"
                            />
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <button
                                    onClick={() => onSwitchBalance?.(BalanceType.REAL)}
                                    disabled={!onSwitchBalance || isLocked}
                                    className={`py-2 rounded-lg text-xs font-bold border ${activeBalanceType === BalanceType.REAL ? 'bg-rose-500/30 border-rose-400/50 text-rose-300' : 'bg-slate-700 text-slate-300 border-slate-600'}`}
                                >
                                    REAL ({realBalance.toFixed(2)})
                                </button>
                                <button
                                    onClick={() => onSwitchBalance?.(BalanceType.BONUS)}
                                    disabled={!onSwitchBalance || isLocked}
                                    className={`py-2 rounded-lg text-xs font-bold border ${activeBalanceType === BalanceType.BONUS ? 'bg-pink-500/30 border-pink-400/50 text-pink-300' : 'bg-slate-700 text-slate-300 border-slate-600'}`}
                                >
                                    BONUS ({bonusBalance.toFixed(2)})
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Free bet */}
            {canPlayFreebet && status === GameStatus.IDLE && (
                <motion.div
                    className="mb-2 rounded-xl border border-amber-400/35 bg-amber-950/40 px-3 py-2 flex items-center gap-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Gift className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="text-xs font-bold text-amber-100/95 leading-snug">
                        Next play is your free bet ({freebetGrant.amount.toFixed(2)})
                        {remainingFreebets > 1 ? ` · ${remainingFreebets} left` : ''}
                    </span>
                </motion.div>
            )}

            {/* Bottom bar */}
            <div className="flex items-center justify-between gap-4 bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl border border-slate-700/50 shadow-xl relative">

                {/* Left: Bet tap */}
                <button
                    type="button"
                    onClick={() => setShowMobileBet(!showMobileBet)}
                    className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-slate-700/50 border border-slate-600/30 text-rose-400"
                >
                    <span className="text-xs font-bold text-slate-400">BET</span>
                    <span className="text-lg font-black font-mono">{fmt(bet)}</span>
                </button>

                {/* Center: Round play button */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4">
                    <motion.button
                        type="button"
                        onClick={startNextRound}
                        disabled={!canClickPlay}
                        className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg
                            ${isLocked || !canClickPlay
                                ? 'bg-slate-700 border-slate-600 text-slate-500 shadow-none'
                                : canPlayFreebet
                                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-200/80 text-amber-950 shadow-amber-500/30'
                                    : 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-300/60 text-white shadow-rose-500/30'
                            }`}
                        whileTap={canClickPlay ? { scale: 0.9 } : {}}
                    >
                        {status === GameStatus.LOADING ? (
                            <Sparkles className="w-8 h-8 animate-spin" />
                        ) : status === GameStatus.PLAYING ? (
                            <div className="scale-75">
                                <Timer seconds={timer} />
                            </div>
                        ) : canPlayFreebet ? (
                            <Gift className="w-8 h-8" />
                        ) : (
                            <Play className="w-8 h-8 fill-current ml-1" />
                        )}
                    </motion.button>
                </div>

                {/* Right: Sound & Payouts */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={toggleSound}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${soundEnabled ? 'bg-rose-900/40 border-rose-500/30 text-rose-400' : 'bg-slate-700/50 border-slate-600/30 text-slate-400'}`}
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowPayouts?.(true)}
                        className="w-12 h-12 rounded-xl flex items-center justify-center border bg-pink-900/40 border-pink-500/30 text-pink-400"
                    >
                        <Info size={20} />
                    </button>
                </div>
            </div>

            {/* Balance label */}
            <div className="text-center mt-2 text-xs font-bold text-slate-500">
                {activeBalanceType} BALANCE: <span className="text-green-400 font-mono">{balance.toFixed(2)}</span>
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden lg:block">{DesktopContent}</div>
            <div className="lg:hidden">{MobileContent}</div>
        </>
    );
};