import React from 'react';
import { motion } from 'framer-motion';

const PARTICLE_POS = [
    { left: '10%', top: '15%' }, { left: '85%', top: '10%' },
    { left: '20%', top: '75%' }, { left: '80%', top: '80%' },
    { left: '50%', top: '5%' },  { left: '5%',  top: '45%' },
    { left: '92%', top: '50%' }, { left: '35%', top: '90%' },
    { left: '65%', top: '88%' }, { left: '15%', top: '50%' },
    { left: '75%', top: '30%' }, { left: '45%', top: '20%' },
];

export const CactusLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c0008] overflow-hidden font-sans">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0010_0%,_#0c0008_60%,_#000_100%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-rose-600/8 to-transparent blur-3xl rounded-full" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
                {PARTICLE_POS.map((pos, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-rose-500/40"
                        style={pos}
                        animate={{ y: [0, -18, 0], opacity: [0.2, 0.7, 0.2] }}
                        transition={{ duration: 2.5 + (i % 4) * 0.6, repeat: Infinity, delay: i * 0.22 }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Icon container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-2"
                >
                    <motion.div
                        className="absolute inset-0 rounded-full border border-rose-500/20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                        className="absolute inset-2 rounded-full border border-pink-400/10"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                        className="absolute inset-4 rounded-full bg-rose-600/10"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.15, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-5xl md:text-6xl select-none relative z-10 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]">🍒</span>
                </motion.div>

                {/* Typography */}
                <div className="text-center relative">
                    <motion.h1
                        className="text-4xl md:text-6xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-rose-500 to-pink-400 drop-shadow-2xl uppercase mb-1 leading-tight"
                        initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        CHERRY
                    </motion.h1>

                    <motion.div
                        className="flex items-center justify-center gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <div className="h-[1px] w-10 md:w-16 bg-gradient-to-r from-transparent to-rose-500/40" />
                        <span className="text-rose-400/80 text-xs md:text-sm font-black tracking-[0.5em] uppercase">PLAY</span>
                        <div className="h-[1px] w-10 md:w-16 bg-gradient-to-l from-transparent to-rose-500/40" />
                    </motion.div>
                </div>

                {/* Sub-label */}
                <motion.p
                    className="text-slate-500 text-[11px] font-mono tracking-[0.3em] uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    GEM STRIKE
                </motion.p>

                {/* Progress bar */}
                <div className="w-64 md:w-80 h-0.5 bg-slate-800/60 rounded-full overflow-hidden relative">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-600 via-rose-400 to-pink-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }}
                    />
                </div>
            </div>
        </div>
    );
};
