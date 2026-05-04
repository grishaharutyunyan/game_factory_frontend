import { Suspense } from 'react';
import GameWrapper from '../../../games/nine-card-mystery/index';

function CardGameLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400">
            Loading…
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<CardGameLoading />}>
            <GameWrapper />
        </Suspense>
    );
}
