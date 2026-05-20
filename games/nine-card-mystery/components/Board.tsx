import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import { GameStatus, CardType } from '../types';

interface BoardProps {
    cards: CardType[];
    selectedIndices: number[];
    status: GameStatus;
    onSelect: (index: number) => void;
    result?: 'win' | 'lose';
}

export const Board: React.FC<BoardProps> = ({ cards, selectedIndices, status, onSelect, result }) => {
    const allSelected = selectedIndices.length >= 3;
    const isPlaying = status === GameStatus.PLAYING;

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-rose-600/10 blur-3xl -z-10" />

            {/* Pick 3 cards instruction */}
            <AnimatePresence>
                {isPlaying && !allSelected && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap"
                    >
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-black uppercase tracking-widest backdrop-blur-sm shadow-[0_0_16px_rgba(244,63,94,0.25)]">
                            Pick {3 - selectedIndices.length} card{3 - selectedIndices.length !== 1 ? 's' : ''}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-6 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-slate-900/70 rounded-3xl border-2 border-slate-700/50 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(100,116,139,0.05)]">
                {Array.from({ length: 9 }).map((_, i) => {
                    const isFinished = status === GameStatus.FINISHED;
                    const isSelected = selectedIndices.includes(i);
                    const isLoseSelected = isFinished && result === 'lose' && isSelected;
                    const revealDelay = isSelected ? 0 : 0.8;
                    const isLocked = isPlaying && !isSelected && allSelected;

                    return (
                        <motion.div
                            key={i}
                            animate={{ opacity: isLocked ? 0.35 : 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card
                                index={i}
                                type={isFinished ? cards[i] : null}
                                revealed={isFinished}
                                selected={isSelected}
                                onSelect={onSelect}
                                disabled={status !== GameStatus.PLAYING || isSelected || allSelected}
                                revealDelay={revealDelay}
                                isLoseSelected={isLoseSelected}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
