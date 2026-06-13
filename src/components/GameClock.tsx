import { useState, useEffect } from 'react';
import { Timer, AlertCircle } from 'lucide-react';

interface GameClockProps {
  turn: 'w' | 'b';
  status: string;
  whiteTimeRemaining?: number; // in seconds
  blackTimeRemaining?: number; // in seconds
  lastMoveTimestamp?: number; // epoch ms
  isUnlimited?: boolean;
  onTimeout: (loserColor: 'w' | 'b') => void;
}

export default function GameClock({
  turn,
  status,
  whiteTimeRemaining,
  blackTimeRemaining,
  lastMoveTimestamp,
  isUnlimited = false,
  onTimeout,
}: GameClockProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status !== 'playing' || isUnlimited) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => clearInterval(interval);
  }, [status, isUnlimited]);

  if (isUnlimited || whiteTimeRemaining === undefined || blackTimeRemaining === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#21201d] text-zinc-400 font-sans text-xs rounded border border-[#312e2b]">
        <Timer className="w-3.5 h-3.5 text-zinc-500" />
        <span>Untimed Match</span>
      </div>
    );
  }

  // Calculate elapsed time since the last move in seconds
  const secondsElapsedSinceLastMove = lastMoveTimestamp
    ? Math.max(0, (now - lastMoveTimestamp) / 1000)
    : 0;

  const currentWhiteTime =
    turn === 'w' && status === 'playing'
      ? Math.max(0, whiteTimeRemaining - secondsElapsedSinceLastMove)
      : whiteTimeRemaining;

  const currentBlackTime =
    turn === 'b' && status === 'playing'
      ? Math.max(0, blackTimeRemaining - secondsElapsedSinceLastMove)
      : blackTimeRemaining;

  // Trigger timeout callback if either player's clock hits zero
  useEffect(() => {
    if (status !== 'playing') return;

    if (currentWhiteTime <= 0) {
      onTimeout('w');
    } else if (currentBlackTime <= 0) {
      onTimeout('b');
    }
  }, [currentWhiteTime, currentBlackTime, status, onTimeout]);

  const formatTime = (totalSeconds: number) => {
    const s = Math.ceil(totalSeconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;

    const formattedSecs = secs < 10 ? `0${secs}` : secs;

    // Show decimal sub-seconds if less than 10 seconds remaining for ultimate chess intensity
    if (totalSeconds < 10 && totalSeconds > 0) {
      return `${totalSeconds.toFixed(1)}s`;
    }

    return `${mins}:${formattedSecs}`;
  };

  const isWhiteUrgent = currentWhiteTime <= 15;
  const isBlackUrgent = currentBlackTime <= 15;

  return (
    <div className="flex flex-col gap-2 w-full p-1 bg-[#262421] border border-[#312e2b] rounded shadow-lg">
      <div className="flex items-center justify-between gap-3 font-sans text-sm font-semibold">
        {/* White Clock Status card */}
        <div
          className={`flex-1 flex items-center justify-between p-2 rounded border transition-colors ${
            turn === 'w' && status === 'playing'
              ? isWhiteUrgent
                ? 'bg-red-950/45 border-red-500 text-red-100 font-bold'
                : 'bg-white border-zinc-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
              : 'bg-[#1b1a17]/70 border-[#312e2b] text-zinc-550'
          }`}
          id="clock-white"
        >
          <div className="flex items-center gap-1.5 pl-1">
            <span className={`w-2 h-2 rounded-full border border-black/20 ${turn === 'w' && status === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-zinc-650'}`} />
            <span className="text-[11px] uppercase font-bold tracking-wider">White</span>
          </div>
          <div className="flex items-center gap-1 pr-1">
            <span className="font-mono text-base font-bold tracking-tight">
              {formatTime(currentWhiteTime)}
            </span>
            {isWhiteUrgent && status === 'playing' && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-bounce" />}
          </div>
        </div>

        {/* Black Clock Status card */}
        <div
          className={`flex-1 flex items-center justify-between p-2 rounded border transition-colors ${
            turn === 'b' && status === 'playing'
              ? isBlackUrgent
                ? 'bg-red-950/45 border-red-500 text-red-100 font-bold'
                : 'bg-white border-zinc-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
              : 'bg-[#1b1a17]/70 border-[#312e2b] text-zinc-550'
          }`}
          id="clock-black"
        >
          <div className="flex items-center gap-1.5 pl-1">
            <span className={`w-2 h-2 rounded-full border border-black/20 ${turn === 'b' && status === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-zinc-650'}`} />
            <span className="text-[11px] uppercase font-bold tracking-wider">Black</span>
          </div>
          <div className="flex items-center gap-1 pr-1">
            <span className="font-mono text-base font-bold tracking-tight">
              {formatTime(currentBlackTime)}
            </span>
            {isBlackUrgent && status === 'playing' && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-bounce" />}
          </div>
        </div>
      </div>
    </div>
  );
}
