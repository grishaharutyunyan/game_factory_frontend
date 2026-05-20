import React from 'react';
import { motion } from 'framer-motion';
import { CardType } from '../types';
import { Gem, Star, Diamond, Sparkles } from 'lucide-react';

const PARTICLE_POSITIONS = [
    { left: '15%', top: '10%' }, { left: '80%', top: '15%' },
    { left: '50%', top: '5%' },  { left: '10%', top: '60%' },
    { left: '85%', top: '55%' }, { left: '25%', top: '85%' },
    { left: '70%', top: '80%' }, { left: '55%', top: '45%' },
];

interface CardProps {
    index: number;
    type: CardType | null;
    revealed: boolean;
    selected: boolean;
    onSelect: (index: number) => void;
    disabled: boolean;
    revealDelay?: number;
    /** True when result === 'lose' and this card was selected — shows bomb explosion instead of card type */
    isLoseSelected?: boolean;
}

export const Card: React.FC<CardProps> = ({ index, type, revealed, selected, onSelect, disabled, revealDelay = 0, isLoseSelected = false }) => {
    const getCardContent = () => {
        switch (type) {
            case CardType.GEM:
                return {
                    icon: <Gem className="w-16 h-16 md:w-16 md:h-16 text-rose-300 drop-shadow-[0_0_20px_rgba(244,63,94,1)]" />,
                    bgGradient: 'from-rose-800/95 via-rose-700/85 to-slate-800/95',
                    borderColor: 'border-rose-400/60',
                    glowColor: 'shadow-[0_0_30px_rgba(244,63,94,0.6),inset_0_0_20px_rgba(244,63,94,0.2)]',
                    particles: 'bg-rose-400/40'
                };
            case CardType.STAR:
                return {
                    icon: <Star className="w-16 h-16 md:w-16 md:h-16 text-yellow-300 fill-current drop-shadow-[0_0_20px_rgba(250,204,21,1)]" />,
                    bgGradient: 'from-yellow-800/95 via-yellow-700/85 to-slate-800/95',
                    borderColor: 'border-yellow-400/60',
                    glowColor: 'shadow-[0_0_30px_rgba(250,204,21,0.6),inset_0_0_20px_rgba(250,204,21,0.2)]',
                    particles: 'bg-yellow-400/40'
                };
            case CardType.CRYSTAL:
                return {
                    icon: <Diamond className="w-16 h-16 md:w-16 md:h-16 text-violet-300 drop-shadow-[0_0_20px_rgba(167,139,250,1)]" />,
                    bgGradient: 'from-violet-800/95 via-violet-700/85 to-slate-800/95',
                    borderColor: 'border-violet-400/60',
                    glowColor: 'shadow-[0_0_30px_rgba(167,139,250,0.6),inset_0_0_20px_rgba(167,139,250,0.2)]',
                    particles: 'bg-violet-400/40'
                };
            default:
                return null;
        }
    };

    const cardContent = getCardContent();

    return (
        <motion.div
            className={`relative w-24 h-36 sm:w-28 sm:h-40 md:w-28 md:h-40 lg:w-32 lg:h-48 [perspective:1000px] ${disabled && !revealed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                {/* Front (Hidden) */}
                <div
                    className={`absolute inset-0 w-full h-full rounded-2xl flex items-center justify-center [backface-visibility:hidden] overflow-hidden
                        ${selected
                            ? 'bg-gradient-to-br from-yellow-900/40 via-yellow-800/30 to-slate-900/40 border-2 border-yellow-400/80 shadow-[0_0_25px_rgba(250,204,21,0.7),inset_0_0_30px_rgba(250,204,21,0.15)]'
                            : 'bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-900/70 border-2 border-slate-600/40 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_20px_rgba(100,116,139,0.1)] hover:border-slate-500/60 hover:shadow-[0_8px_40px_rgba(100,116,139,0.3)]'}
                        backdrop-blur-sm transition-all duration-300
                    `}
                >
                    <div className={`absolute inset-0 bg-gradient-to-tr ${selected ? 'from-yellow-500/10 via-transparent to-yellow-500/5' : 'from-slate-500/5 via-transparent to-slate-400/5'} opacity-50`} />

                    <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-2xl ${selected ? 'border-yellow-400/60' : 'border-slate-500/30'}`} />
                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-2xl ${selected ? 'border-yellow-400/60' : 'border-slate-500/30'}`} />

                    <div className="relative z-10">
                        <div className="text-5xl md:text-6xl font-black text-slate-400/30 drop-shadow-[0_0_10px_rgba(100,116,139,0.3)]">?</div>
                    </div>

                    {selected && (
                        <motion.div
                            className="absolute top-3 right-3 w-5 h-5 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,1)]"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            <Sparkles className="w-3 h-3 text-yellow-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </motion.div>
                    )}

                    {!disabled && !revealed && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                        />
                    )}
                </div>

                {/* Back (Revealed) */}
                {isLoseSelected ? (
                    /* Bomb explosion effect for lose + selected cards */
                    <div className="absolute inset-0 w-full h-full rounded-2xl border-2 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden bg-gradient-to-br from-red-800/95 via-orange-700/85 to-red-800/95 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.8),inset_0_0_20px_rgba(239,68,68,0.2)]">
                        {/* Explosion ring */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl border-4 border-orange-400/60"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 0.6] }}
                            transition={{ duration: 0.5, delay: revealDelay + 0.3 }}
                        />

                        {/* Particle bursts */}
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-orange-400"
                                style={{ left: '50%', top: '50%' }}
                                initial={{ x: 0, y: 0, opacity: 0 }}
                                animate={{
                                    x: Math.cos((i / 8) * Math.PI * 2) * 50,
                                    y: Math.sin((i / 8) * Math.PI * 2) * 50,
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.5, 0]
                                }}
                                transition={{ duration: 0.6, delay: revealDelay + 0.35 + i * 0.02 }}
                            />
                        ))}

                        {/* Explosion emoji */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0, rotate: -20 }}
                            animate={{ scale: [0, 1.4, 1.1], opacity: [0, 1, 1], rotate: [-20, 10, 0] }}
                            transition={{ duration: 0.5, delay: revealDelay + 0.3, type: 'spring', stiffness: 300 }}
                            className="relative z-10 text-5xl md:text-6xl select-none"
                        >
                            💥
                        </motion.div>

                        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 rounded-tl-2xl border-red-500/60 opacity-60" />
                        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 rounded-br-2xl border-red-500/60 opacity-60" />
                    </div>
                ) : cardContent ? (
                    /* Normal card reveal */
                    <div
                        className={`absolute inset-0 w-full h-full rounded-2xl border-2 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden
                            bg-gradient-to-br ${cardContent.bgGradient} ${cardContent.borderColor} ${cardContent.glowColor}
                        `}
                    >
                        <div className="absolute inset-0 opacity-30">
                            {PARTICLE_POSITIONS.map((pos, i) => (
                                <motion.div
                                    key={i}
                                    className={`absolute w-1 h-1 rounded-full ${cardContent.particles}`}
                                    style={pos}
                                    animate={{
                                        y: [0, -20, 0],
                                        opacity: [0.2, 0.8, 0.2],
                                        scale: [1, 1.5, 1]
                                    }}
                                    transition={{
                                        duration: 2 + (i % 3) * 0.7,
                                        repeat: Infinity,
                                        delay: (i % 4) * 0.5
                                    }}
                                />
                            ))}
                        </div>

                        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/30" />

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

                        <div className={`absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 rounded-tl-2xl ${cardContent.borderColor} opacity-60`} />
                        <div className={`absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 rounded-br-2xl ${cardContent.borderColor} opacity-60`} />
                    </div>
                ) : null}
            </motion.div>
        </motion.div>
    );
};