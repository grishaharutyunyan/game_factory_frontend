import React from 'react';
import { motion } from 'framer-motion';
import { CardType } from '../types';
import { Gem, Bomb, Star, Gift, Sparkles } from 'lucide-react';

interface CardProps {
    index: number;
    type: CardType | null;
    revealed: boolean;
    selected: boolean;
    onSelect: (index: number) => void;
    disabled: boolean;
    revealDelay?: number;
}

export const Card: React.FC<CardProps> = ({ index, type, revealed, selected, onSelect, disabled, revealDelay = 0 }) => {
    const getCardContent = () => {
        switch (type) {
            case CardType.GEM:
                return {
                    icon: <Gem className="w-14 h-14 md:w-16 md:h-16 text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,1)]" />,
                    bgGradient: 'from-cyan-950/90 via-cyan-900/80 to-slate-900/90',
                    borderColor: 'border-cyan-400/60',
                    glowColor: 'shadow-[0_0_30px_rgba(34,211,238,0.6),inset_0_0_20px_rgba(34,211,238,0.1)]',
                    particles: 'bg-cyan-400/20'
                };
            case CardType.BOMB:
                return {
                    icon: <Bomb className="w-14 h-14 md:w-16 md:h-16 text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,1)]" />,
                    bgGradient: 'from-red-950/90 via-red-900/80 to-slate-900/90',
                    borderColor: 'border-red-500/60',
                    glowColor: 'shadow-[0_0_30px_rgba(239,68,68,0.6),inset_0_0_20px_rgba(239,68,68,0.1)]',
                    particles: 'bg-red-400/20'
                };
            case CardType.STAR:
                return {
                    icon: <Star className="w-14 h-14 md:w-16 md:h-16 text-yellow-300 fill-current drop-shadow-[0_0_20px_rgba(250,204,21,1)]" />,
                    bgGradient: 'from-yellow-950/90 via-yellow-900/80 to-slate-900/90',
                    borderColor: 'border-yellow-400/60',
                    glowColor: 'shadow-[0_0_30px_rgba(250,204,21,0.6),inset_0_0_20px_rgba(250,204,21,0.1)]',
                    particles: 'bg-yellow-400/20'
                };
            case CardType.GIFT:
                return {
                    icon: <Gift className="w-14 h-14 md:w-16 md:h-16 text-purple-300 drop-shadow-[0_0_20px_rgba(192,132,252,1)]" />,
                    bgGradient: 'from-purple-950/90 via-purple-900/80 to-slate-900/90',
                    borderColor: 'border-purple-400/60',
                    glowColor: 'shadow-[0_0_30px_rgba(192,132,252,0.6),inset_0_0_20px_rgba(192,132,252,0.1)]',
                    particles: 'bg-purple-400/20'
                };
            default:
                return null;
        }
    };

    const cardContent = getCardContent();

    return (
        <motion.div
            className={`relative w-20 h-28 md:w-28 md:h-40 lg:w-32 lg:h-48 [perspective:1000px] ${disabled && !revealed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onSelect(index)}
            whileHover={!disabled && !revealed ? { scale: 1.05, y: -5 } : {}}
            whileTap={!disabled && !revealed ? { scale: 0.95 } : {}}
        >
            <motion.div
                className="w-full h-full relative [transform-style:preserve-3d]"
                initial={false}
                animate={{ rotateY: revealed ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", delay: revealed ? revealDelay : 0 }}
            >
                {/* Front (Hidden) - Premium Glassmorphism Design */}
                <div
                    className={`absolute inset-0 w-full h-full rounded-2xl flex items-center justify-center [backface-visibility:hidden] overflow-hidden
                        ${selected
                            ? 'bg-gradient-to-br from-yellow-900/40 via-yellow-800/30 to-slate-900/40 border-2 border-yellow-400/80 shadow-[0_0_25px_rgba(250,204,21,0.7),inset_0_0_30px_rgba(250,204,21,0.15)]'
                            : 'bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-900/70 border-2 border-slate-600/40 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_20px_rgba(100,116,139,0.1)] hover:border-slate-500/60 hover:shadow-[0_8px_40px_rgba(100,116,139,0.3)]'}
                        backdrop-blur-sm transition-all duration-300
                    `}
                >
                    {/* Animated gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-tr ${selected ? 'from-yellow-500/10 via-transparent to-yellow-500/5' : 'from-slate-500/5 via-transparent to-slate-400/5'} opacity-50`} />

                    {/* Decorative corner accents */}
                    <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-2xl ${selected ? 'border-yellow-400/60' : 'border-slate-500/30'}`} />
                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-2xl ${selected ? 'border-yellow-400/60' : 'border-slate-500/30'}`} />

                    {/* Center question mark with glow */}
                    <div className="relative z-10">
                        <div className="text-5xl md:text-6xl font-black text-slate-400/30 drop-shadow-[0_0_10px_rgba(100,116,139,0.3)]">?</div>
                    </div>

                    {/* Selection indicator with pulse animation */}
                    {selected && (
                        <motion.div
                            className="absolute top-3 right-3 w-5 h-5 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,1)]"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            <Sparkles className="w-3 h-3 text-yellow-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </motion.div>
                    )}

                    {/* Shimmer effect */}
                    {!disabled && !revealed && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                        />
                    )}
                </div>

                {/* Back (Revealed) - Enhanced with card-specific styling */}
                {cardContent && (
                    <div
                        className={`absolute inset-0 w-full h-full rounded-2xl border-2 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden
                            bg-gradient-to-br ${cardContent.bgGradient} ${cardContent.borderColor} ${cardContent.glowColor}
                            backdrop-blur-sm
                        `}
                    >
                        {/* Animated background particles */}
                        <div className="absolute inset-0 opacity-30">
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`absolute w-1 h-1 rounded-full ${cardContent.particles}`}
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        y: [0, -20, 0],
                                        opacity: [0.2, 0.8, 0.2],
                                        scale: [1, 1.5, 1]
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2
                                    }}
                                />
                            ))}
                        </div>

                        {/* Radial gradient overlay */}
                        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/30" />

                        {/* Icon with entrance animation */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                delay: revealed ? revealDelay + 0.3 : 0
                            }}
                            className="relative z-10"
                        >
                            {cardContent.icon}
                        </motion.div>

                        {/* Decorative corner accents */}
                        <div className={`absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 rounded-tl-2xl ${cardContent.borderColor} opacity-60`} />
                        <div className={`absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 rounded-br-2xl ${cardContent.borderColor} opacity-60`} />
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};
