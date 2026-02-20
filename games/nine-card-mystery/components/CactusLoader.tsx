import React from 'react';
import { motion } from 'framer-motion';

export const CactusLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                {/* Subtle spotlight */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-green-500/5 to-transparent blur-3xl rounded-full opacity-30" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Logo / Icon Container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-4"
                >
                    {/* Glowing ring */}
                    <div className="absolute inset-0 border-2 border-green-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-2 border border-green-400/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                    {/* Central Icon (Cactus-like geometric shape) */}
                    <svg viewBox="0 0 100 100" className="w-12 h-12 md:w-16 md:h-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                        <motion.path
                            d="M50 85 L50 15 M50 50 L25 35 M50 40 L75 25"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                    </svg>
                </motion.div>

                {/* Typography */}
                <div className="text-center relative">
                    <motion.h1
                        className="text-4xl md:text-6xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400 drop-shadow-2xl uppercase mb-2 leading-tight"
                        initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        CACTUS
                    </motion.h1>

                    <motion.div
                        className="flex items-center justify-center gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <div className="h-[1px] w-8 md:w-16 bg-gradient-to-r from-transparent to-slate-500/50" />
                        <span className="text-slate-400 text-xs md:text-sm font-bold tracking-[0.5em] uppercase">GAMING</span>
                        <div className="h-[1px] w-8 md:w-16 bg-gradient-to-l from-transparent to-slate-500/50" />
                    </motion.div>
                </div>

                {/* Loader Bar */}
                <div className="mt-8 w-64 md:w-80 h-1 bg-slate-800/50 rounded-full overflow-hidden relative">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                            duration: 2.5,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatDelay: 0.5
                        }}
                    />
                </div>

                <motion.p
                    className="text-slate-500 text-[10px] font-mono tracking-widest uppercase mt-2"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    System Initializing...
                </motion.p>
            </div>
        </div>
    );
};
