import { useRef, useEffect } from 'react';
import { Award, Scroll } from 'lucide-react';
import { ChessMove } from '../types';

interface MoveHistoryProps {
  history: ChessMove[];
  status: string;
  winner: string | null;
}

export default function MoveHistory({ history, status, winner }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll moves list to bottom when a move is appended
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Transform flat array of moves into paired records: [ [moveWhite, moveBlack?], ... ]
  const getPairedMoves = () => {
    const pairs: [ChessMove, ChessMove | null][] = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push([history[i], history[i + 1] || null]);
    }
    return pairs;
  };

  const pairedMoves = getPairedMoves();

  return (
    <div className="flex flex-col h-full bg-[#262421] border border-[#312e2b] rounded overflow-hidden shadow w-full">
      {/* Header bar */}
      <div className="bg-[#1b1a17] px-4 py-2.5 border-b border-[#312e2b] flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-200">
          <Scroll className="w-3.5 h-3.5 text-green-500" />
          <h3 className="font-sans font-bold text-xs">Move Log ({history.length})</h3>
        </div>
        {status !== 'playing' && status !== 'waiting' && (
          <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-sans font-bold bg-green-950/20 px-2 py-0.5 rounded border border-green-905/30">
            <Award className="w-3 h-3" />
            <span>Match Over</span>
          </div>
        )}
      </div>

      {/* Moves column log body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 scrollbar-thin max-h-[160px] md:max-h-[220px]"
      >
        {pairedMoves.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-6 text-center text-xs space-y-1">
            <span>No moves made yet</span>
            <span>Unleash a pawn to start the timer!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-[#312e2b]/40">
            {pairedMoves.map(([whiteMove, blackMove], index) => (
              <div
                key={index}
                className="grid grid-cols-12 py-1 px-1.5 hover:bg-[#312e2b]/30 transition rounded text-[11px]"
              >
                {/* Index col */}
                <div className="col-span-2 text-zinc-500 font-bold">{index + 1}.</div>
                {/* White move */}
                <div className="col-span-5 text-zinc-200 font-semibold">{whiteMove.san}</div>
                {/* Black move */}
                <div className="col-span-5 text-zinc-400 font-semibold">
                  {blackMove ? blackMove.san : <span className="text-zinc-600 animate-pulse">...</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {status !== 'playing' && status !== 'waiting' && (
        <div className="bg-[#1b1a17] px-4 py-2 border-t border-[#312e2b] text-center text-xs">
          <span className="text-zinc-400 font-sans font-medium">
            Result:{' '}
            <span className="text-white font-bold">
              {winner === 'w'
                ? 'White wins! 🏆'
                : winner === 'b'
                ? 'Black wins! 🏆'
                : winner === 'draw'
                ? 'Game Draw 🤝'
                : 'Match Terminated'}
            </span>
          </span>
          <p className="text-[9px] text-[#81b64c] font-mono mt-0.5">Status: {status.toUpperCase()}</p>
        </div>
      )}
    </div>
  );
}
