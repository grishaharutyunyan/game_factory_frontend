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
    bet, setBet, onStart, status, balance, realBalance = 0, bonusBalance = 0,
    activeBalanceType = BalanceType.REAL, onSwitchBalance, message, winAmount, error,
    soundEnabled, toggleSound, setShowPayouts, timer = 30,
    isFreeBet, freebetEnabled, remainingFreebets = 0, freebetGrant, minBet, maxBet,
}) => {
    const betOptions = [10, 50, 100, 500, 1000];

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
    const DesktopPanel = (
        <div className="flex flex-col w-full max-w-md gap-5 p-7 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 rounded-3xl border-2 border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(100,116,139,0.05)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-pink-500/5 pointer-events-none" />
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-slate-600/40 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-slate-600/40 rounded-br-3xl" />

            {/* Balance */}
            <motion.div
                className="relative bg-gradient-to-br from-slate-800/80 via-slate-700/60 to-slate-800/80 p-4 rounded-2xl border-2 border-slate-600/40 overflow-hidden"
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
                        <div className="p-2 bg-green-500/20 rounded-xl border border-green-400/30">
                            <Coins className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Balance</span>
                            <span className="text-2xl font-mono font-black text-green-400">
                                {balance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    {winAmount > 0 && (
                        <motion.div
                            className="flex items-center gap-1.5 bg-yellow-500/20 px-3 py-2 rounded-xl border border-yellow-400/30"
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
                {[BalanceType.REAL, BalanceType.BONUS].map((type) => {
                    const isActive = activeBalanceType === type;
                    const amt = type === BalanceType.REAL ? realBalance : bonusBalance;
                    return (
                        <motion.button
                            key={type}
                            onClick={() => onSwitchBalance?.(type)}
                            disabled={isLocked || !onSwitchBalance}
                            className={`px-3 py-3 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                ${isActive
                                    ? type === BalanceType.REAL
                                        ? 'bg-gradient-to-br from-rose-600 to-rose-700 text-white border-rose-400/60'
                                        : 'bg-gradient-to-br from-pink-600 to-pink-700 text-white border-pink-400/60'
                                    : 'bg-slate-800/60 text-slate-300 border-slate-600/40 hover:border-slate-500/60'
                                }`}
                            whileHover={!isLocked ? { scale: 1.02 } : {}}
                            whileTap={!isLocked ? { scale: 0.98 } : {}}
                        >
                            {type} · {amt.toFixed(2)}
                        </motion.button>
                    );
                })}
            </div>

            {/* Free bet notice */}
            {canPlayFreebet && status === GameStatus.IDLE && (
                <motion.div
                    className="relative overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-950/50 via-amber-900/30 to-amber-950/50 p-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15">
                            <Gift className="h-5 w-5 text-amber-300" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-200/90">Free bet active</p>
                            <p className="text-sm text-amber-100/90">
                                Stake: <span className="font-bold text-amber-200">{freebetGrant.amount.toFixed(2)}</span>
                                {remainingFreebets > 1 ? ` · ${remainingFreebets} left` : ''}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Status message */}
            <motion.div
                className={`min-h-[52px] flex flex-col items-center justify-center text-center font-bold text-base px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all
                    ${error
                        ? 'bg-red-950/40 border-red-500/50 text-red-400'
                        : winAmount > 0
                            ? 'bg-yellow-950/40 border-yellow-400/50 text-yellow-300'
                            : 'bg-slate-800/40 border-slate-600/40 text-slate-200'
                    }`}
                animate={error ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.5, repeat: error ? Infinity : 0 }}
            >
                {status === GameStatus.PLAYING && isFreeBet && (
                    <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-0.5 text-xs font-black uppercase tracking-widest text-amber-300">
                        <Gift className="h-3 w-3" />Free bet round
                    </span>
                )}
                {error || message || (status === GameStatus.IDLE ? 'Ready to Play' : 'Pick 3 Cards')}
            </motion.div>

            {/* Bet controls */}
            <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <label className="text-slate-300 text-sm uppercase font-bold tracking-wider">Bet</label>
                    {minBet !== undefined && maxBet !== undefined && (
                        <span className="text-slate-500 text-xs ml-auto">{minBet} – {maxBet}</span>
                    )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                    {betOptions.map(amount => (
                        <motion.button
                            key={amount}
                            onClick={() => setBet(amount)}
                            disabled={isLocked}
                            className={`relative py-3 text-sm rounded-xl font-bold transition-all overflow-hidden border-2 disabled:opacity-40 disabled:cursor-not-allowed
                                ${bet === amount
                                    ? 'bg-gradient-to-br from-rose-600 to-rose-700 text-white border-rose-400/60 shadow-[0_0_16px_rgba(244,63,94,0.4)]'
                                    : 'bg-gradient-to-br from-slate-700/60 to-slate-800/60 text-slate-300 border-slate-600/40 hover:border-slate-500/60'
                                }`}
                            whileHover={!isLocked ? { scale: 1.05, y: -2 } : {}}
                            whileTap={!isLocked ? { scale: 0.95 } : {}}
                        >
                            {bet === amount && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                                />
                            )}
                            <span className="relative z-10">{fmt(amount)}</span>
                        </motion.button>
                    ))}
                </div>
                <input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    disabled={isLocked}
                    className="w-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-slate-600/40 rounded-xl py-3.5 px-4 text-white text-lg font-mono font-bold focus:outline-none focus:border-rose-500/60 focus:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all disabled:opacity-40"
                    placeholder="Custom amount"
                />
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
                        <><Gift className="w-5 h-5" />Play — Free Bet</>
                    ) : (
                        <><Play className="w-5 h-5 fill-current" />Start Game</>
                    )}
                </span>
            </motion.button>

            {/* Validation messages */}
            <AnimatePresence>
                {!canPlayFreebet && bet > balance && (
                    <motion.p className="text-red-400 text-sm text-center font-semibold -mt-2"
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        Insufficient balance
                    </motion.p>
                )}
                {!canPlayFreebet && betTooLow && (
                    <motion.p className="text-yellow-400 text-sm text-center font-semibold -mt-2"
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        Minimum bet is {minBet}
                    </motion.p>
                )}
                {!canPlayFreebet && betTooHigh && (
                    <motion.p className="text-yellow-400 text-sm text-center font-semibold -mt-2"
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        Maximum bet is {maxBet}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );

    /* ── Mobile bottom bar ─────────────────────────────────────── */
    const MobileBar = (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-[0_-8px_40px_rgba(0,0,0,0.6)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>

            {/* Free bet / freebet-round pill */}
            <AnimatePresence>
                {((canPlayFreebet && status === GameStatus.IDLE) || (isFreeBet && status === GameStatus.PLAYING)) && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="flex justify-center pt-2 pb-0"
                    >
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/45 bg-amber-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
                            <Gift className="h-3 w-3" />
                            {isFreeBet && status === GameStatus.PLAYING ? 'Free Bet Round' : `Free bet · ${freebetGrant?.amount.toFixed(2)}`}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Balance row */}
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
                <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-green-400/70" />
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{activeBalanceType}</span>
                    <span className="text-sm font-mono font-black text-green-400">{balance.toFixed(2)}</span>
                </div>
                {winAmount > 0 && (
                    <motion.div
                        className="flex items-center gap-1 text-yellow-400 text-xs font-bold"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                    >
                        <TrendingUp className="w-3 h-3" />
                        +{winAmount.toFixed(2)}
                    </motion.div>
                )}
                {/* Balance switcher pill */}
                <div className="flex gap-1">
                    {[BalanceType.REAL, BalanceType.BONUS].map((type) => (
                        <button
                            key={type}
                            onClick={() => onSwitchBalance?.(type)}
                            disabled={isLocked || !onSwitchBalance}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border transition-all disabled:opacity-40
                                ${activeBalanceType === type
                                    ? type === BalanceType.REAL
                                        ? 'bg-rose-500/30 border-rose-400/50 text-rose-300'
                                        : 'bg-pink-500/30 border-pink-400/50 text-pink-300'
                                    : 'bg-slate-800 border-slate-600/40 text-slate-400'
                                }`}
                        >
                            {type === BalanceType.REAL ? 'Real' : 'Bonus'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bet chips row */}
            <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
                {betOptions.map(amount => (
                    <motion.button
                        key={amount}
                        onClick={() => setBet(amount)}
                        disabled={isLocked}
                        className={`shrink-0 h-9 px-4 rounded-full text-sm font-black border-2 transition-all disabled:opacity-40
                            ${bet === amount
                                ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                                : 'bg-slate-800 text-slate-300 border-slate-600/50'
                            }`}
                        whileTap={!isLocked ? { scale: 0.92 } : {}}
                    >
                        {fmt(amount)}
                    </motion.button>
                ))}
                {/* Custom inline input */}
                <input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    disabled={isLocked}
                    className="shrink-0 h-9 w-20 bg-slate-800 border-2 border-slate-600/50 rounded-full px-3 text-white text-sm font-mono font-bold focus:outline-none focus:border-rose-500/60 disabled:opacity-40 text-center"
                />
            </div>

            {/* Validation hint */}
            <AnimatePresence>
                {!canPlayFreebet && (bet > balance || betOutOfRange) && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="text-center text-xs font-semibold pb-1 text-red-400"
                    >
                        {bet > balance ? 'Insufficient balance' : betTooLow ? `Min ${minBet}` : `Max ${maxBet}`}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Action row */}
            <div className="flex items-center px-4 pb-2 gap-3">
                {/* Left icons */}
                <div className="flex gap-2">
                    <motion.button
                        type="button"
                        onClick={toggleSound}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all
                            ${soundEnabled
                                ? 'bg-rose-900/40 border-rose-500/40 text-rose-400'
                                : 'bg-slate-800/60 border-slate-600/40 text-slate-500'
                            }`}
                        whileTap={{ scale: 0.9 }}
                    >
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={() => setShowPayouts?.(true)}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center border-2 bg-pink-900/40 border-pink-500/40 text-pink-400"
                        whileTap={{ scale: 0.9 }}
                    >
                        <Info size={18} />
                    </motion.button>
                </div>

                {/* Play button — fills remaining space */}
                <motion.button
                    type="button"
                    onClick={startNextRound}
                    disabled={!canClickPlay}
                    className={`flex-1 h-14 rounded-2xl font-black text-base uppercase tracking-widest transition-all border-2 relative overflow-hidden
                        ${isLocked || !canClickPlay
                            ? 'bg-slate-800/60 text-slate-500 border-slate-600/40'
                            : canPlayFreebet
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 border-amber-300/80 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                                : 'bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                        }`}
                    whileTap={canClickPlay ? { scale: 0.97 } : {}}
                >
                    {canClickPlay && status === GameStatus.IDLE && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {status === GameStatus.LOADING ? (
                            <><Sparkles className="w-5 h-5 animate-spin" />Connecting…</>
                        ) : status === GameStatus.PLAYING ? (
                            <div className="flex items-center gap-2">
                                <Timer seconds={timer} />
                            </div>
                        ) : canPlayFreebet ? (
                            <><Gift className="w-5 h-5" />Free Bet</>
                        ) : (
                            <><Play className="w-5 h-5 fill-current" />Play</>
                        )}
                    </span>
                </motion.button>
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden lg:block">{DesktopPanel}</div>
            <div className="lg:hidden">{MobileBar}</div>
        </>
    );
};
