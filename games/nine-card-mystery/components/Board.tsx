import React from 'react';
import { Card } from './Card';
import { GameStatus, CardType } from '../types';

interface BoardProps {
    cards: CardType[];
    selectedIndices: number[];
    status: GameStatus;
    onSelect: (index: number) => void;
}

export const Board: React.FC<BoardProps> = ({ cards, selectedIndices, status, onSelect }) => {
    return (
        <div className="relative">
            {/* Glow effect behind board */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-blue-500/10 blur-3xl -z-10" />

            <div className="grid grid-cols-3 gap-2 md:gap-4 p-3 md:p-6 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-slate-900/70 rounded-3xl border-2 border-slate-700/50 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(100,116,139,0.05)]">
                {Array.from({ length: 9 }).map((_, i) => {
                    const isFinished = status === GameStatus.FINISHED;
                    const isSelected = selectedIndices.includes(i);

                    // Reveal if finished. 
                    // If finished:
                    // - Selected cards reveal immediately (delay 0)
                    // - Unselected cards reveal after selected ones (delay 0.8s)
                    const revealDelay = isSelected ? 0 : 0.8;

                    return (
                        <Card
                            key={i}
                            index={i}
                            type={isFinished ? cards[i] : null}
                            revealed={isFinished}
                            selected={isSelected}
                            onSelect={onSelect}
                            disabled={status !== GameStatus.PLAYING || isSelected || selectedIndices.length >= 3}
                            revealDelay={revealDelay}
                        />
                    );
                })}
            </div>
        </div>
    );
};
