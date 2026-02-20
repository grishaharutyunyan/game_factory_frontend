"use client";

import React, { useEffect, useState } from 'react';
import { useNineCardGame } from './useNineCardGame';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Timer } from './components/Timer';
import { CactusLoader } from './components/CactusLoader';
import { GameStatus } from './types';
import { INVALID_SESSION_MESSAGE } from './useNineCardGame';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Info } from 'lucide-react';

const GameWrapper = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const sess = params.get('session');
            if (sess) setSessionId(sess);
            else {
                console.warn("No session ID found in URL");
            }
        }
    }, []);

    if (!sessionId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500">Missing Session</h1>
                    <p className="text-slate-400">Please provide ?session=... in the URL</p>
                </div>
            </div>
        );
    }

    return <NineCardMysteryGame sessionId={sessionId} />;
};

const NineCardMysteryGame = ({ sessionId }: { sessionId: string }) => {
    // Token is usually for auth, maybe same as session or from cookies.
    // Passing 'demo-token' for now.
    const {
        state, startGame, selectCard, setBet, reset,
        soundEnabled, toggleSound
    } = useNineCardGame('demo-token', sessionId);
    const [showModal, setShowModal] = useState(false);
    const [showPayouts, setShowPayouts] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fake loading delay to show off animation
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (state.status === GameStatus.FINISHED) {
            // Delay modal to allow card reveal animations (0.8s delay + 0.6s duration + buffer)
            timer = setTimeout(() => {
                setShowModal(true);
            }, 2000);
        } else {
            setShowModal(false);
        }
        return () => clearTimeout(timer);
    }, [state.status]);

    const handleReset = () => {
        setShowModal(false);
        reset();
    };

    if (isLoading) {
        return <CactusLoader />;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 flex relative overflow-hidden">
            <AnimatePresence>
                {state.error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-red-500/50 bg-slate-900/90 max-w-md w-full"
                        >
                            <div className="text-6xl mb-4">⚠️</div>
                            <h2 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">
                                Warning
                            </h2>
                            <p className="text-xl font-bold text-slate-200">
                                Technical Issue
                            </p>
                            <p className="text-slate-400 mt-2 text-sm">
                                {state.error}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3 justify-center">
                                {state.error === INVALID_SESSION_MESSAGE && (
                                    <button
                                        onClick={() => { window.location.href = window.location.pathname; }}
                                        className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-full font-bold transition-colors"
                                    >
                                        Try different session
                                    </button>
                                )}
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors"
                                >
                                    Reload Game
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showModal && !state.error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleReset}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: "spring", damping: 15 }}
                            className={`p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 max-w-lg w-full
                                ${state.winAmount > 0
                                    ? 'bg-gradient-to-b from-yellow-900/90 to-yellow-950/90 border-yellow-400/50 shadow-yellow-500/20'
                                    : 'bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-slate-600/50 shadow-slate-500/20'}
                            `}
                        >
                            <h2 className={`text-5xl md:text-7xl font-black tracking-widest uppercase drop-shadow-2xl mb-4
                                ${state.winAmount > 0 ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600' : 'text-slate-400'}
                            `}>
                                {state.winAmount > 0 ? 'YOU WIN!' : 'YOU LOSE'}
                            </h2>

                            {state.winAmount > 0 && (
                                <div className="text-4xl font-mono font-bold text-yellow-100 flex items-center justify-center gap-2">
                                    <span className="text-yellow-400">$</span>
                                    {state.winAmount.toFixed(2)}
                                </div>
                            )}

                            {state.message && (
                                <p className={`mt-4 text-lg font-medium
                                    ${state.winAmount > 0 ? 'text-yellow-200/80' : 'text-slate-500'}
                                `}>
                                    {state.message}
                                </p>
                            )}

                            <p className="mt-8 text-sm text-slate-500 font-semibold uppercase tracking-wider">
                                Click anywhere to continue
                            </p>
                        </motion.div>
                    </motion.div>
                )}

                {/* Payouts Modal */}
                {showPayouts && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPayouts(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 cursor-pointer"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-md w-full cursor-default"
                        >
                            <div className="p-6 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 rounded-3xl border-2 border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(100,116,139,0.05)] backdrop-blur-md relative overflow-hidden">
                                {/* Ambient glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                                {/* Decorative corner accents */}
                                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-slate-600/40 rounded-tl-3xl" />
                                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-slate-600/40 rounded-br-3xl" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className="text-slate-200 font-black text-xl flex items-center gap-2">
                                            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-400/30">
                                                <Info size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
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

                                    <div className="space-y-2">
                                        {/* 3 Gems - Highest payout */}
                                        <motion.div
                                            className="flex justify-between items-center p-3 bg-gradient-to-r from-cyan-950/60 to-cyan-900/40 rounded-xl border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all group"
                                            whileHover={{ scale: 1.02, x: 2 }}
                                        >
                                            <span className="text-slate-200 font-semibold flex items-center gap-2">
                                                <span className="text-lg">💎💎💎</span>
                                                <span className="text-sm">3 Gems</span>
                                            </span>
                                            <span className="text-cyan-300 font-black text-lg drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] group-hover:scale-110 transition-transform">5x</span>
                                        </motion.div>

                                        {/* 2 Gems + Gift */}
                                        <motion.div
                                            className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-950/60 to-purple-900/40 rounded-xl border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all group"
                                            whileHover={{ scale: 1.02, x: 2 }}
                                        >
                                            <span className="text-slate-200 font-semibold flex items-center gap-2">
                                                <span className="text-lg">💎💎🎁</span>
                                                <span className="text-sm">2 Gems + Gift</span>
                                            </span>
                                            <span className="text-purple-300 font-black text-lg drop-shadow-[0_0_8px_rgba(192,132,252,0.5)] group-hover:scale-110 transition-transform">3x</span>
                                        </motion.div>

                                        {/* 2 Gems + Star */}
                                        <motion.div
                                            className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-950/60 to-yellow-900/40 rounded-xl border border-yellow-500/30 backdrop-blur-sm hover:border-yellow-400/50 transition-all group"
                                            whileHover={{ scale: 1.02, x: 2 }}
                                        >
                                            <span className="text-slate-200 font-semibold flex items-center gap-2">
                                                <span className="text-lg">💎💎⭐</span>
                                                <span className="text-sm">2 Gems + Star</span>
                                            </span>
                                            <span className="text-yellow-300 font-black text-lg drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform">2x</span>
                                        </motion.div>

                                        {/* 3 Gifts */}
                                        <motion.div
                                            className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-950/60 to-purple-900/40 rounded-xl border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all group"
                                            whileHover={{ scale: 1.02, x: 2 }}
                                        >
                                            <span className="text-slate-200 font-semibold flex items-center gap-2">
                                                <span className="text-lg">🎁🎁🎁</span>
                                                <span className="text-sm">3 Gifts</span>
                                            </span>
                                            <span className="text-purple-300 font-black text-lg drop-shadow-[0_0_8px_rgba(192,132,252,0.5)] group-hover:scale-110 transition-transform">1.5x</span>
                                        </motion.div>

                                        {/* Bomb - Lose */}
                                        <motion.div
                                            className="flex justify-between items-center p-3 bg-gradient-to-r from-red-950/60 to-red-900/40 rounded-xl border border-red-500/30 backdrop-blur-sm hover:border-red-400/50 transition-all group"
                                            whileHover={{ scale: 1.02, x: 2 }}
                                        >
                                            <span className="text-slate-200 font-semibold flex items-center gap-2">
                                                <span className="text-lg">💣</span>
                                                <span className="text-sm">Bomb</span>
                                            </span>
                                            <span className="text-red-400 font-black text-lg drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] group-hover:scale-110 transition-transform">LOSE</span>
                                        </motion.div>
                                    </div>

                                    <p className="mt-6 text-center text-slate-500 text-sm font-semibold uppercase tracking-wider">
                                        Click anywhere to close
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left panel – vertical game name */}
            <aside className="hidden lg:flex shrink-0 w-16 md:w-20 items-center justify-center py-8 border-r border-slate-800/60 bg-slate-900/30">
                <h1
                    className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 drop-shadow-xl select-none tracking-widest"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    9 CARD MYSTERY
                </h1>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 min-h-screen">
                {/* Mobile: show title horizontally; desktop: title is in left panel */}
                <h1 className="lg:hidden text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 drop-shadow-xl tracking-widest mb-1">
                    9 CARD MYSTERY
                </h1>
                <p className="text-slate-500 text-sm md:text-base font-medium tracking-wide mb-4 md:mb-6">Find 3 Gems to Win Big!</p>

                <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 items-center lg:items-start justify-center w-full max-w-6xl">
                    {/* Game Board with Floating Timer */}
                    <div className="flex-1 flex justify-center relative">
                        {/* Floating Timer - positioned absolutely on top of cards */}
                        <AnimatePresence>
                            {state.status === GameStatus.PLAYING && (
                                <motion.div
                                    className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                    }}
                                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                                    transition={{
                                        duration: 0.3,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25
                                    }}
                                >
                                    <Timer seconds={state.timer} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Game Board */}
                        <Board
                            cards={state.cards}
                            selectedIndices={state.selectedIndices}
                            status={state.status}
                            onSelect={selectCard}
                        />
                    </div>

                    {/* Controls */}
                    <div className="w-full lg:w-auto">
                        <Controls
                            bet={state.bet}
                            setBet={setBet}
                            onStart={startGame}
                            status={state.status}
                            balance={state.balance}
                            message={state.message}
                            winAmount={state.winAmount}
                            error={state.error}
                            soundEnabled={soundEnabled}
                            toggleSound={toggleSound}
                            setShowPayouts={setShowPayouts}
                            timer={state.timer}
                        />

                        {/* Sound Controls & Info Button - Desktop Only */}
                        <div className="mt-6 hidden lg:flex gap-3">
                            <motion.button
                                onClick={() => setShowPayouts(true)}
                                className="flex-1 p-4 rounded-xl transition-colors border-2 border-purple-500/40 bg-gradient-to-br from-purple-900/60 to-purple-800/50 text-purple-300 hover:from-purple-800/70 hover:to-purple-700/60 hover:border-purple-400/60 backdrop-blur-sm font-bold flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Info size={20} />
                                <span>Payouts</span>
                            </motion.button>
                            <motion.button
                                onClick={toggleSound}
                                className={`flex-1 p-4 rounded-xl transition-colors border-2 backdrop-blur-sm font-bold flex items-center justify-center gap-2
                                ${soundEnabled
                                        ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-900/60 to-cyan-800/50 text-cyan-300 hover:from-cyan-800/70 hover:to-cyan-700/60 hover:border-cyan-400/60'
                                        : 'border-slate-600/40 bg-gradient-to-br from-slate-800/60 to-slate-700/50 text-slate-400 hover:from-slate-700/70 hover:to-slate-600/60 hover:border-slate-500/60'
                                    }`}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                            </motion.button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default GameWrapper;
