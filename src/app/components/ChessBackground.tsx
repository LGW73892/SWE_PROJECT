import { useMemo } from 'react';

const PIECES = ['♔','♕','♖','♗','♘','♙','♚','♛','♜','♝','♞','♟'];
const COUNT = 22;

interface FloatingPiece {
    id: number;
    piece: string;
    x: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
    drift: number;
    rotation: number;
}

export default function ChessBackground() {
    const pieces = useMemo<FloatingPiece[]>(() =>
            Array.from({ length: COUNT }, (_, i) => ({
                id: i,
                piece: PIECES[Math.floor(Math.random() * PIECES.length)],
                x: Math.random() * 100,
                size: Math.floor(Math.random() * 40 + 30),
                duration: Math.random() * 14 + 10,
                delay: -(Math.random() * 20),
                opacity: Math.random() * 0.18 + 0.06,
                drift: Math.floor((Math.random() - 0.5) * 80),
                rotation: Math.floor((Math.random() - 0.5) * 30),
            }))
        , []);

    return (
        <>
            <style>{`
        @keyframes chessDrift {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: var(--piece-op); }
          90%  { opacity: var(--piece-op); }
          100% { transform: translateY(-110vh) translateX(var(--piece-drift)) rotate(var(--piece-rot)); opacity: 0; }
        }
      `}</style>

            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                {pieces.map(p => (
                    <span
                        key={p.id}
                        className="absolute bottom-0 select-none text-[#1a5c42]"
                        style={{
                            left: `${p.x}%`,
                            fontSize: `${p.size}px`,
                            animationName: 'chessDrift',
                            animationDuration: `${p.duration.toFixed(1)}s`,
                            animationDelay: `${p.delay.toFixed(1)}s`,
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                            ['--piece-op' as string]: p.opacity.toFixed(2),
                            ['--piece-drift' as string]: `${p.drift}px`,
                            ['--piece-rot' as string]: `${p.rotation}deg`,
                        }}
                    >
            {p.piece}
          </span>
                ))}
            </div>
        </>
    );
}