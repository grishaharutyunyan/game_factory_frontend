import React from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
    seconds: number;
    maxSeconds?: number;
}

export const Timer: React.FC<TimerProps> = ({ seconds, maxSeconds = 30 }) => {
    // Calculate progress percentage (100% when full, 0% when empty)
    const progress = (seconds / maxSeconds) * 100;

    // Dynamic color based on time remaining
    const getColorScheme = () => {
        if (seconds > 15) {
            return {
                primary: '#22d3ee',
                secondary: '#06b6d4',
                glow: 'rgba(34, 211, 238, 0.6)',
                textColor: 'text-cyan-300',
            };
        }
        if (seconds > 10) {
            return {
                primary: '#3b82f6',
                secondary: '#2563eb',
                glow: 'rgba(59, 130, 246, 0.6)',
                textColor: 'text-blue-300',
            };
        }
        if (seconds > 5) {
            return {
                primary: '#facc15',
                secondary: '#eab308',
                glow: 'rgba(250, 204, 21, 0.6)',
                textColor: 'text-yellow-300',
            };
        }
        return {
            primary: '#ef4444',
            secondary: '#dc2626',
            glow: 'rgba(239, 68, 68, 0.7)',
            textColor: 'text-red-300',
        };
    };

    const colorScheme = getColorScheme();
    const isUrgent = seconds <= 5;

    return (
        <motion.div
            className="relative w-16 h-16 flex items-center justify-center"
            animate={isUrgent ? {
                scale: [1, 1.1, 1],
            } : {}}
            transition={isUrgent ? {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
            } : {}}
            style={{
                filter: `drop-shadow(0 4px 12px ${colorScheme.glow})`
            }}
        >
            {/* SVG Circle Progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle with glassmorphism */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="rgba(15, 23, 42, 0.85)"
                    stroke="rgba(71, 85, 105, 0.5)"
                    strokeWidth="2"
                />

                {/* Progress circle */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={`url(#gradient-${seconds})`}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="251" // 2 * PI * 40
                    initial={{ strokeDashoffset: 0 }}
                    animate={{
                        strokeDashoffset: 251 - (251 * progress) / 100,
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                />

                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`gradient-${seconds}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colorScheme.primary} />
                        <stop offset="100%" stopColor={colorScheme.secondary} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Timer Number */}
            <motion.div
                className={`text-2xl font-black font-mono ${colorScheme.textColor} z-10`}
                style={{
                    textShadow: `0 0 12px ${colorScheme.glow}`
                }}
                animate={isUrgent ? {
                    scale: [1, 1.15, 1]
                } : {}}
                transition={isUrgent ? {
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                } : {}}
            >
                {seconds}
            </motion.div>
        </motion.div>
    );
};
