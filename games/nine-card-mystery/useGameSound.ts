import { useEffect, useRef, useState, useCallback } from 'react';
import { Howl } from 'howler';

type SoundType = 'click' | 'win' | 'lose' | 'start';

/** Try MP3 first (better browser support), then WAV. Add .mp3 files to public/sounds/ if WAV fails to decode. */
const SOUND_SOURCES: Record<SoundType, string[]> = {
    click: ['/sounds/click.wav'],
    win: ['/sounds/win.wav'],
    lose: ['/sounds/lose.wav'],
    start: ['/sounds/start.wav'],
};

export const useGameSound = () => {
    const [soundEnabled, setSoundEnabled] = useState(true);

    const soundsRef = useRef<Record<SoundType, Howl | null>>({
        click: null,
        win: null,
        lose: null,
        start: null,
    });

    useEffect(() => {
        const unlockAudio = () => {
            if (Howler.ctx?.state === 'suspended') {
                Howler.ctx.resume();
            }
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        const loadSound = (type: SoundType, vol: number) => {
            const src = SOUND_SOURCES[type];
            const howl = new Howl({
                src,
                volume: vol,
                html5: true, // Uses HTML5 Audio; often more reliable for WAV in some browsers
                onloaderror: () => {
                    // Decoding failed (e.g. unsupported WAV format). Don't log to avoid console noise.
                    soundsRef.current[type] = null;
                    try { howl.unload(); } catch { /* ignore */ }
                },
                onplayerror: () => {
                    Howler.ctx?.resume();
                    howl.once('unlock', () => howl.play());
                },
            });
            return howl;
        };

        soundsRef.current = {
            click: loadSound('click', 0.5),
            win: loadSound('win', 0.6),
            lose: loadSound('lose', 0.5),
            start: loadSound('start', 0.5),
        };

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            Object.values(soundsRef.current).forEach(sound => sound?.unload());
        };
    }, []);

    const playSound = useCallback((type: SoundType) => {
        if (!soundEnabled) return;
        const sound = soundsRef.current[type];
        if (sound) sound.play();
    }, [soundEnabled]);

    const toggleSound = () => setSoundEnabled(prev => !prev);

    return {
        soundEnabled,
        toggleSound,
        playSound,
    };
};
