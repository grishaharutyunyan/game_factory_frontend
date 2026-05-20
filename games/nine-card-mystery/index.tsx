"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNineCardGame } from './useNineCardGame';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Timer } from './components/Timer';
import { CactusLoader } from './components/CactusLoader';
import { BalanceType, GameStatus } from './types';
import { INVALID_SESSION_MESSAGE } from './useNineCardGame';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Info } from 'lucide-react';

const GameWrapper = () => {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session')?.trim() || null;

    if (!sessionId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0c0008] text-white">
                <div className="text-center space-y-2">
                    <div className="text-5xl">⚠️</div>
                    <h1 className="text-xl font-bold text-red-400">Missing Session</h1>
                    <p className="text-slate-500 text-sm">Please provide ?session=… in the URL</p>
                </div>
            </div>
        );
    }

    return <NineCardMysteryGame sessionId={sessionId} />;
};

const NineCardMysteryGame = ({ sessionId }: { sessionId: string }) => {
    const {
        state, startGame, switchBalance, selectCard, setBet, reset, closeGame,
        soundEnabled, toggleSound
    } = useNineCardGame('demo-token', sessionId);

    const [showModal, setShowModal] = useState(false);
    const [showPayouts, setShowPayouts] = useState(false);
    const modalShownAtRef = useRef<number>(0);

    const isJackpot = state.result === 'win' && state.bet > 0 && state.winAmount >= state.bet * 4.9;
    const cardsReceived = state.cards.some(c => c !== null);

    useEffect(() => {
        if (state.status !== GameStatus.FINISHED || !cardsReceived) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowModal(false);
            return;
        }
        const t = setTimeout(() => {
            modalShownAtRef.current = Date.now();
            setShowModal(true);
        }, 2000);
        return () => clearTimeout(t);
    }, [state.status, cardsReceived]);

    const handleReset = () => {
        if (Date.now() - modalShownAtRef.current < 800) return;
        setShowModal(false);
        reset();
    };

    if (state.status === GameStatus.LOADING && !state.error) {
        return <CactusLoader />;
    }

    const sharedControlsProps = {
        bet: state.bet,
        setBet,
        onStart: (useFreebet?: boolean) => startGame(useFreebet === true, state.activeBalanceType),
        onSwitchBalance: (type: BalanceType) => switchBalance(type),
        status: state.status,
        balance: state.balance,
        realBalance: state.realBalance,
        bonusBalance: state.bonusBalance,
        activeBalanceType: state.activeBalanceType,
        message: state.message,
        winAmount: state.winAmount,
        error: state.error,
        soundEnabled,
        toggleSound,
        setShowPayouts,
        timer: state.timer,
        isFreeBet: state.isFreeBet,
        freebetEnabled: state.freebetEnabled,
        remainingFreebets: state.remainingFreebets,
        freebetGrant: state.freebetGrants?.[0],
        minBet: state.minBet,
        maxBet: state.maxBet,
    };

    return (
        <div className="min-h-screen bg-[#0c0008] text-slate-100 font-sans selection:bg-rose-500/30 flex relative overflow-hidden">

            {/* ── Modals ──────────────────────────────────────────── */}
            <AnimatePresence>

                {/* Error overlay */}
                {state.error && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-red-500/50 bg-slate-900/90 max-w-sm w-full"
                        >
                            <div className="text-5xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-black text-red-400 uppercase tracking-widest mb-2">Technical Issue</h2>
                            <p className="text-slate-400 mt-2 text-sm leading-relaxed">{state.error}</p>
                            <div className="mt-6 flex flex-wrap gap-3 justify-center">
                                {state.error === INVALID_SESSION_MESSAGE && (
                                    <button
                                        onClick={() => { window.location.href = window.location.pathname; }}
                                        className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold text-sm transition-colors"
                                    >
                                        Try Again
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={closeGame}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-sm transition-colors"
                                >
                                    Close Game
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Result modal */}
                {showModal && !state.error && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleReset}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                    >
                        {isJackpot && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(24)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2.5 h-2.5 rounded-sm"
                                        style={{
                                            left: `${15 + (i % 8) * 10}%`,
                                            top: '55%',
                                            background: ['#fbbf24', '#f59e0b', '#34d399', '#22d3ee', '#a78bfa', '#f472b6'][i % 6],
                                            rotate: `${i * 15}deg`,
                                        }}
                                        initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
                                        animate={{
                                            y: -(250 + (i % 5) * 60),
                                            x: (i % 2 === 0 ? 1 : -1) * (20 + (i % 6) * 18),
                                            opacity: 0,
                                            scale: [1, 1.4, 0],
                                        }}
                                        transition={{ duration: 1.4, delay: i * 0.04, ease: 'easeOut' }}
                                    />
                                ))}
                            </div>
                        )}

                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className={`p-8 rounded-3xl text-center border-4 max-w-sm w-full
                                ${state.winAmount > 0
                                    ? isJackpot
                                        ? 'bg-gradient-to-b from-yellow-800/95 to-amber-950/95 border-yellow-300/80 shadow-[0_0_70px_rgba(251,191,36,0.55)]'
                                        : 'bg-gradient-to-b from-yellow-900/90 to-yellow-950/90 border-yellow-400/50 shadow-[0_0_40px_rgba(250,204,21,0.3)]'
                                    : 'bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-slate-600/50'
                                }`}
                        >
                            {isJackpot && (
                                <motion.div
                                    className="text-xs font-black uppercase tracking-[0.3em] text-amber-300 mb-2"
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    ✦ JACKPOT ✦
                                </motion.div>
                            )}

                            <h2 className={`text-5xl md:text-6xl font-black tracking-widest uppercase drop-shadow-2xl mb-4
                                ${state.winAmount > 0
                                    ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600'
                                    : 'text-slate-400'
                                }`}>
                                {state.winAmount > 0 ? 'YOU WIN!' : 'YOU LOSE'}
                            </h2>

                            {state.winAmount > 0 && (
                                <motion.div
                                    className="text-4xl font-mono font-black text-yellow-100"
                                    animate={isJackpot ? { scale: [1, 1.06, 1] } : {}}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                >
                                    {state.winAmount.toFixed(2)}
                                </motion.div>
                            )}

                            <p className="mt-8 text-xs text-slate-500 font-semibold uppercase tracking-widest">
                                Tap to continue
                            </p>
                        </motion.div>
                    </motion.div>
                )}

                {/* Payouts modal — slides up from bottom on mobile, centered on desktop */}
                {showPayouts && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowPayouts(false)}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
                    >
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full sm:max-w-md cursor-default"
                        >
                            <div
                                className="bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-slate-900/98 rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-slate-700/50 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] backdrop-blur-md relative overflow-hidden p-5"
                                style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-pink-500/5 pointer-events-none" />
                                <div className="sm:hidden w-10 h-1 rounded-full bg-slate-600/60 mx-auto mb-4" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-slate-200 font-black text-lg flex items-center gap-2">
                                            <div className="p-1.5 bg-rose-500/20 rounded-lg border border-rose-400/30">
                                                <Info size={16} className="text-rose-400" />
                                            </div>
                                            Payouts
                                        </h3>
                                        <button
                                            onClick={() => setShowPayouts(false)}
                                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="space-y-1.5">
                                        {[
                                            { icons: '💎💎💎', label: '3 Gems', mult: '5×', clr: 'rose', tag: 'JACKPOT' },
                                            { icons: '💎💎⭐', label: '2 Gems + Star', mult: '4×', clr: 'yellow', tag: null },
                                            { icons: '💎💎🔮', label: '2 Gems + Crystal', mult: '4×', clr: 'violet', tag: null },
                                            { icons: '⭐⭐⭐', label: '3 Stars', mult: '2×', clr: 'amber', tag: null },
                                            { icons: '🔮🔮🔮', label: '3 Crystals', mult: '2×', clr: 'purple', tag: null },
                                            { icons: '💥', label: 'Anything else', mult: 'LOSE', clr: 'red', tag: null },
                                        ].map(({ icons, label, mult, clr, tag }) => {
                                            const bg: Record<string, string> = {
                                                rose:   'from-rose-950/60 to-rose-900/40 border-rose-500/30 hover:border-rose-400/50',
                                                yellow: 'from-yellow-950/60 to-yellow-900/40 border-yellow-500/30 hover:border-yellow-400/50',
                                                violet: 'from-violet-950/60 to-violet-900/40 border-violet-500/30 hover:border-violet-400/50',
                                                amber:  'from-yellow-950/60 to-amber-900/40 border-yellow-600/30 hover:border-yellow-500/50',
                                                purple: 'from-violet-950/60 to-purple-900/40 border-violet-600/30 hover:border-violet-500/50',
                                                red:    'from-red-950/60 to-red-900/40 border-red-500/30 hover:border-red-400/50',
                                            };
                                            const mc: Record<string, string> = {
                                                rose:   'text-rose-300',
                                                yellow: 'text-yellow-300',
                                                violet: 'text-violet-300',
                                                amber:  'text-yellow-400',
                                                purple: 'text-violet-400',
                                                red:    'text-red-400',
                                            };
                                            return (
                                                <motion.div
                                                    key={label}
                                                    className={`flex justify-between items-center p-3 bg-gradient-to-r ${bg[clr]} rounded-xl border backdrop-blur-sm transition-all group`}
                                                    whileHover={{ scale: 1.02, x: 2 }}
                                                >
                                                    <span className="text-slate-200 font-semibold flex items-center gap-2 text-sm">
                                                        <span className="text-base">{icons}</span>
                                                        {label}
                                                        {tag && (
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-400/30">
                                                                {tag}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className={`font-black text-base group-hover:scale-110 transition-transform ${mc[clr]}`}>
                                                        {mult}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Desktop: vertical title sidebar ─────────────────── */}
            <aside className="hidden lg:flex shrink-0 w-20 items-center justify-center py-8 border-r border-slate-800/60 bg-slate-900/30">
                <h1
                    className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-b from-rose-300 via-rose-500 to-pink-500 select-none tracking-widest"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    GEM STRIKE
                </h1>
            </aside>

            {/* ── Main area ───────────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-h-screen">

                {/* Mobile header bar */}
                <div className="lg:hidden flex items-center justify-between px-4 pt-safe pt-4 pb-2 shrink-0">
                    <h1 className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-300 via-rose-500 to-pink-400 tracking-widest">
                        GEM STRIKE
                    </h1>
                    <div className="flex items-center gap-2">
                        <AnimatePresence>
                            {state.status === GameStatus.PLAYING && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="scale-[0.65] origin-right -mr-2"
                                >
                                    <Timer seconds={state.timer} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button type="button" onClick={toggleSound}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${soundEnabled ? 'bg-rose-900/40 border-rose-500/30 text-rose-400' : 'bg-slate-800/60 border-slate-600/30 text-slate-500'}`}>
                            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        </button>
                        <button type="button" onClick={() => setShowPayouts(true)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border bg-pink-900/40 border-pink-500/30 text-pink-400">
                            <Info size={14} />
                        </button>
                    </div>
                </div>

                {/* Mobile subtitle */}
                <p className="lg:hidden text-center text-slate-600 text-[11px] font-medium tracking-wider mb-2">
                    3 Gems = Jackpot · 2 Gems = Win
                </p>

                {/* Content row */}
                <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-8
                    px-2 sm:px-4 lg:px-8
                    pb-[190px] lg:pb-8
                    pt-1 lg:pt-8"
                >
                    {/* Board column */}
                    <div className="w-full lg:flex-1 flex flex-col items-center gap-3">
                        <p className="hidden lg:block text-slate-500 text-sm font-medium tracking-wide">
                            3 Gems = Jackpot · 2 Gems = Win
                        </p>

                        <AnimatePresence>
                            {state.status === GameStatus.PLAYING && (
                                <motion.div
                                    className="hidden lg:block"
                                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: 10 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                >
                                    <Timer seconds={state.timer} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Board
                            cards={state.cards}
                            selectedIndices={state.selectedIndices}
                            status={state.status}
                            onSelect={selectCard}
                            result={state.result}
                        />
                    </div>

                    {/* Desktop controls */}
                    <div className="hidden lg:flex flex-col gap-4 w-full max-w-sm shrink-0">
                        <Controls {...sharedControlsProps} />

                        <div className="flex gap-3">
                            <motion.button type="button" onClick={() => setShowPayouts(true)}
                                className="flex-1 p-4 rounded-xl border-2 border-pink-500/40 bg-gradient-to-br from-pink-900/60 to-pink-800/50 text-pink-300 font-bold flex items-center justify-center gap-2 hover:border-pink-400/60 transition-colors"
                                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <Info size={18} /><span>Payouts</span>
                            </motion.button>
                            <motion.button type="button" onClick={toggleSound}
                                className={`flex-1 p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-colors
                                    ${soundEnabled
                                        ? 'border-rose-500/40 bg-gradient-to-br from-rose-900/60 to-rose-800/50 text-rose-300 hover:border-rose-400/60'
                                        : 'border-slate-600/40 bg-gradient-to-br from-slate-800/60 to-slate-700/50 text-slate-400 hover:border-slate-500/60'
                                    }`}
                                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Mobile controls (bottom bar — rendered by Controls internally) */}
                    <div className="lg:hidden w-full">
                        <Controls {...sharedControlsProps} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GameWrapper;
