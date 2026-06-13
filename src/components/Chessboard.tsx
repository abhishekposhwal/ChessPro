import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

// Beautiful minimalist high-fidelity custom SVG vectors for chess pieces
export const PIECES_SVG: Record<string, React.ReactNode> = {
  // White Pieces
  wp: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.22)] select-none pointer-events-none">
      <g fill="#FFF" stroke="#000" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="miter">
        <path d="M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 Z" />
      </g>
    </svg>
  ),
  wn: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.22)] select-none pointer-events-none">
      <g fill="#FFF" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M 16,32 C 20.5,34.5 30.5,34.5 34,32 C 34.5,32.5 34,30 34,30 C 34,27.5 30.5,26 30.5,26 C 36,24.5 36.5,11.5 21.5,6.5 C 14.5,14.5 15,24.5 20.5,26 C 20.5,26 16,27.5 16,30 C 16,30 15.5,30.5 16,32 Z" />
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 25.5,34 C 27.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 26.89,38.96 24.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 Z" />
      </g>
      <g transform="translate(+4, -5.5) scale(0.9) rotate(10)" fill="#FFF" stroke="#000" strokeWidth={1.666} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
      </g>
      <g fill="none" stroke="#000" strokeWidth={1.5} strokeLinecap="round">
        <path d="M 20.5,26 L 30.5,26" />
        <path d="M 16.0,30 L 34.0,30" />
        <path d="M 27.5,15 L 26.5,22 M 24.5,17.5 L 29.5,17.5" />
      </g>
      <g transform="translate(+4, -5.5) scale(0.9) rotate(10)" fill="#000" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M 9.5 25.5 A 0.5,0.5,0 1,1 8.5,25.5 A 0.5,0.5,0 1,1 9.5,25.5 Z" />
        <path d="M 15.25 14.2 A 0.5,1.5,30 1,1 13.75,16.8 A 0.5,1.5,30 1,1 15.25,14.2 Z" />
      </g>
    </svg>
  ),
  wb: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.22)] select-none pointer-events-none">
      <g fill="#FFF" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <circle cx={22.5} cy={8} r={2.5} />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 Z" />
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 26.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 Z" />
      </g>
      <g fill="none" stroke="#000" strokeWidth={1.5} strokeLinecap="round">
        <path d="M 17.5,26 L 27.5,26" />
        <path d="M 15.0,30 L 30.0,30" />
        <path d="M 22.5,15 L 22.5,22 M 20,17.5 L 25,17.5" />
      </g>
    </svg>
  ),
  wr: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.22)] select-none pointer-events-none">
      <g fill="#FFF" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 31,17 L 31,29.5 L 33,32 L 33,36 L 12,36 L 12,32 L 14,29.5 L 14,17 Z" />
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
      </g>
      <g fill="none" stroke="#000" strokeLinecap="round">
        <line strokeWidth={1.2} x1="11" y1="14.0" x2="34" y2="14.0" />
        <line strokeWidth={0.8} x1="14" y1="17.0" x2="31" y2="17.0" />
        <line strokeWidth={0.8} x1="14" y1="29.5" x2="31" y2="29.5" />
        <line strokeWidth={1.2} x1="12" y1="32.0" x2="33" y2="32.0" />
      </g>
    </svg>
  ),
  wq: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.22)] select-none pointer-events-none">
      <g fill="#FFF" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 C 25.5,24.5 25,17.5 24.5,14.5 C 24.5,14.5 24,12 22.5,12 C 21,12 20.5,14.5 20.5,14.5 C 20,17.5 19.5,24.5 19.5,24.5 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 Z" />
        <circle cx={6} cy={12} r={2} />
        <circle cx={14} cy={9} r={2} />
        <circle cx={31} cy={9} r={2} />
        <circle cx={39} cy={12} r={2} />
        <path fill="none" strokeLinecap="round" d="M 22.5,11 L 22.5,5 M 20,7 L 25,7" />
        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 Z" />
      </g>
      <g fill="none" stroke="#000" strokeWidth={1.5} strokeLinecap="round">
        <path d="M 11.5,30 C 15,29 30,29 33.5,30" />
        <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" />
      </g>
    </svg>
  ),
  wk: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.22)] select-none pointer-events-none">
      <g fill="#FFF" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path fill="none" strokeLinecap="round" d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" />
        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
        <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37" />
      </g>
      <g fill="none" stroke="#000" strokeWidth={1.5} strokeLinecap="round">
        <path d="M 11.5,30 C 17,27 27,27 32.5,30" />
        <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" />
        <path d="M 11.5,37 C 17,34 27,34 32.5,37" />
      </g>
    </svg>
  ),

  // Black Pieces
  bp: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] select-none pointer-events-none">
      <g fill="#000" stroke="#000" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="miter">
        <path d="M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 Z" />
      </g>
    </svg>
  ),
  bn: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] select-none pointer-events-none">
      <g fill="#000" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M 16,32 C 20.5,34.5 30.5,34.5 34,32 C 34.5,32.5 34,30 34,30 C 34,27.5 30.5,26 30.5,26 C 36,24.5 36.5,11.5 21.5,6.5 C 14.5,14.5 15,24.5 20.5,26 C 20.5,26 16,27.5 16,30 C 16,30 15.5,30.5 16,32 Z" />
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 25.5,34 C 27.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 26.89,38.96 24.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 Z" />
      </g>
      <g transform="translate(+4, -5.5) scale(0.9) rotate(10)" fill="#000" stroke="#000" strokeWidth={1.666} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
      </g>
      <g fill="none" stroke="#FFF" strokeWidth={1.5} strokeLinecap="round">
        <path d="M 20.5,26 L 30.5,26" />
        <path d="M 16.0,30 L 34.0,30" />
        <path d="M 27.5,15 L 26.5,22 M 24.5,17.5 L 29.5,17.5" />
      </g>
      <g transform="translate(+4, -5.5) scale(0.9) rotate(10)" fill="#FFF" stroke="#FFF" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M 9.5 25.5 A 0.5,0.5,0 1,1 8.5,25.5 A 0.5,0.5,0 1,1 9.5,25.5 Z" />
        <path d="M 15.25 14.2 A 0.5,1.5,30 1,1 13.75,16.8 A 0.5,1.5,30 1,1 15.25,14.2 Z" />
      </g>
    </svg>
  ),
  bb: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] select-none pointer-events-none">
      <g fill="#000" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <circle cx={22.5} cy={8} r={2.5} />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 Z" />
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 26.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 Z" />
      </g>
      <g fill="none" stroke="#FFF" strokeWidth={1.5} strokeLinecap="round">
        <path d="M 17.5,26 L 27.5,26" />
        <path d="M 15.0,30 L 30.0,30" />
        <path d="M 22.5,15 L 22.5,22 M 20,17.5 L 25,17.5" />
      </g>
    </svg>
  ),
  br: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] select-none pointer-events-none">
      <g fill="#000" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 31,17 L 31,29.5 L 33,32 L 33,36 L 12,36 L 12,32 L 14,29.5 L 14,17 Z" />
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
      </g>
      <g fill="none" stroke="#FFF" strokeLinecap="round">
        <line strokeWidth={1.2} x1="11" y1="14.0" x2="34" y2="14.0" />
        <line strokeWidth={0.8} x1="14" y1="17.0" x2="31" y2="17.0" />
        <line strokeWidth={0.8} x1="14" y1="29.5" x2="31" y2="29.5" />
        <line strokeWidth={1.2} x1="12" y1="32.0" x2="33" y2="32.0" />
        <line strokeWidth={1.2} x1="12" y1="35.5" x2="33" y2="35.5" />
      </g>
    </svg>
  ),
  bq: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] select-none pointer-events-none">
      <g fill="#000" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 C 25.5,24.5 25,17.5 24.5,14.5 C 24.5,14.5 24,12 22.5,12 C 21,12 20.5,14.5 20.5,14.5 C 20,17.5 19.5,24.5 19.5,24.5 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 Z" />
        <circle cx={6} cy={12} r={2} />
        <circle cx={14} cy={9} r={2} />
        <circle cx={31} cy={9} r={2} />
        <circle cx={39} cy={12} r={2} />
        <path fill="none" strokeLinecap="round" d="M 22.5,11 L 22.5,5 M 20,7 L 25,7" />
        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 Z" />
      </g>
      <g fill="none" stroke="#FFF" strokeWidth={1.5} strokeLinecap="round">
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26" />
        <path d="M 11.5,30 C 15,29 30,29 33.5,30" />
        <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" />
      </g>
    </svg>
  ),
  bk: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] select-none pointer-events-none">
      <g fill="#000" stroke="#000" strokeWidth={1.5} strokeLinejoin="round">
        <path fill="none" strokeLinecap="round" d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" />
        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
        <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37" />
      </g>
      <g fill="none" stroke="#FFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path strokeLinecap="square" d="M 22.5,20 C 22.5,20 25.75,17 24.5,14.5 C 24.5,14.5 24,13 22.5,13 C 21,13 20.5,14.5 20.5,14.5 C 19.25,17 22.5,20 22.5,20" />
        <path d="M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.51,26.6 L 22.5,24.5 C 20,18 9.906,14 6.997,19.85 C 4.5,25.5 11.85,28.85 11.85,28.85" />
        <path d="M 11.5,30 C 17,27 27,27 32.5,30" />
        <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" />
        <path d="M 11.5,37 C 17,34 27,34 32.5,37" />
      </g>
    </svg>
  ),
};

interface ChessboardProps {
  fen: string;
  onMove: (from: string, to: string, promotion?: string) => void;
  playerColor?: 'w' | 'b';
  editable?: boolean;
  lastMove?: { from: string; to: string } | null;
}

export default function Chessboard({
  fen,
  onMove,
  playerColor = 'w',
  editable = true,
  lastMove = null,
}: ChessboardProps) {
  const chess = new Chess(fen);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);
  const [isFlipped, setIsFlipped] = useState(playerColor === 'b');

  const board = chess.board();
  const isChecked = chess.inCheck();

  // Helper arrays for rank/file indexes
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedRanks = isFlipped ? [...ranks].reverse() : ranks;
  const displayedFiles = isFlipped ? [...files].reverse() : files;

  // Find all legal moves for currently selected square
  const getLegalMovesForSelected = (): string[] => {
    if (!selectedSquare) return [];
    const moves = chess.moves({ square: selectedSquare as any, verbose: true });
    return moves.map(m => m.to);
  };

  const legalTargets = getLegalMovesForSelected();

  const handleSquareClick = (squareName: string) => {
    if (!editable) return;

    const piece = chess.get(squareName as any);

    // If first square selected
    if (selectedSquare === null) {
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(squareName);
      }
    } else {
      // Clicking on same piece again cancels selection
      if (selectedSquare === squareName) {
        setSelectedSquare(null);
        return;
      }

      // If clicking on client's other piece, reselect
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(squareName);
        return;
      }

      // Check if clicked square is a valid target
      const move = chess.moves({ square: selectedSquare as any, verbose: true }).find(m => m.to === squareName);

      if (move) {
        // If pawn promotion is required
        if (move.flags.includes('p')) {
          setPromotionPending({ from: selectedSquare, to: squareName });
        } else {
          onMove(selectedSquare, squareName);
          setSelectedSquare(null);
        }
      } else {
        setSelectedSquare(null);
      }
    }
  };

  const handlePromotionSelect = (pieceCode: string) => {
    if (promotionPending) {
      onMove(promotionPending.from, promotionPending.to, pieceCode);
      setPromotionPending(null);
      setSelectedSquare(null);
    }
  };

  return (
    <div className="relative w-full max-w-[520px] mx-auto select-none">
      {/* Mini Toggle to Flip Board */}
      <button
        onClick={() => setIsFlipped(v => !v)}
        className="absolute -top-12 right-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-sans text-xs py-1.5 px-3 rounded-md flex items-center gap-1.5 transition border border-zinc-700 shadow-md"
        title="Flip view"
        id="toggle-flip-board"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Flip Board
      </button>

      {/* Outer elegant borders */}
      <div className="aspect-[1/1] w-full rounded-xl overflow-hidden border-4 border-zinc-800 bg-zinc-900 shadow-2xl relative">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {displayedRanks.map((rankStr, rankIndex) => {
            const actualRankIndex = 8 - parseInt(rankStr);
            return displayedFiles.map((fileStr, fileIndex) => {
              const colIndex = fileStr.charCodeAt(0) - 97; // 'a' equals 0
              const squareName = `${fileStr}${rankStr}`;
              const cellPiece = board[actualRankIndex]?.[colIndex];

              const isDarkSquare = (actualRankIndex + colIndex) % 2 === 1;
              const isSelected = selectedSquare === squareName;
              const isLegalTarget = legalTargets.includes(squareName);
              const isKingCheckedVal = isChecked && cellPiece && cellPiece.type === 'k' && cellPiece.color === chess.turn();

              // Highlights last move source/destination square
              const isLastMoveSrc = lastMove && lastMove.from === squareName;
              const isLastMoveDst = lastMove && lastMove.to === squareName;

              return (
                <div
                  key={squareName}
                  onClick={() => handleSquareClick(squareName)}
                  className={`
                    relative flex items-center justify-center cursor-pointer transition-colors duration-150 aspect-[1/1]
                    ${isDarkSquare ? 'bg-[#769656]' : 'bg-[#eeeed2]'}
                  `}
                  style={{
                    backgroundColor: isSelected
                      ? '#BACA44' // Selected piece glow
                      : isLastMoveSrc || isLastMoveDst
                      ? 'rgba(247, 247, 105, 0.5)' // Last move trace
                      : undefined,
                  }}
                  id={`square-${squareName}`}
                >
                  {/* Coordinate Ranks on left column */}
                  {((!isFlipped && fileIndex === 0) || (isFlipped && fileIndex === 7)) && (
                    <span
                      className={`absolute top-0.5 left-1 font-sans text-[10px] font-bold ${
                        isDarkSquare ? 'text-[#eeeed2]' : 'text-[#769656]'
                      }`}
                    >
                      {rankStr}
                    </span>
                  )}

                  {/* Coordinate Files on bottom row */}
                  {((!isFlipped && rankIndex === 7) || (isFlipped && rankIndex === 0)) && (
                    <span
                      className={`absolute bottom-0.5 right-1 font-sans text-[10px] font-bold ${
                        isDarkSquare ? 'text-[#eeeed2]' : 'text-[#769656]'
                      }`}
                    >
                      {fileStr}
                    </span>
                  )}

                  {/* Red alert for King in Check */}
                  {isKingCheckedVal && (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="absolute inset-0 bg-red-500/40 rounded-full flex items-center justify-center pointer-events-none"
                    >
                      <ShieldAlert className="w-6 h-6 text-red-600 drop-shadow" />
                    </motion.div>
                  )}

                  {/* Legal Move indicator helper */}
                  {isLegalTarget && (
                    <span
                      className={`absolute rounded-full pointer-events-none ${
                        cellPiece
                          ? 'border-[4px] border-black/15 bg-transparent w-[90%] h-[90%]'
                          : 'bg-black/15 w-[25%] h-[25%]'
                      }`}
                    />
                  )}

                  {/* Moveable Piece rendering */}
                  {cellPiece && (
                    <div className="w-[85%] h-[85%] flex items-center justify-center z-10 select-none">
                      {PIECES_SVG[`${cellPiece.color}${cellPiece.type}`]}
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>

        {/* Floating Pawn Promotion selection dialog overlay */}
        <AnimatePresence>
          {promotionPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-30"
              id="promotion-dialog"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 max-w-sm text-center shadow-2xl flex flex-col items-center gap-4"
              >
                <h3 className="font-sans font-bold text-lg text-white">Choose Promotion</h3>
                <p className="font-sans text-xs text-zinc-400">Select which piece your pawn should promote to.</p>
                <div className="flex justify-center gap-3 mt-2">
                  {[
                    { code: 'q', label: 'Queen', key: 'q' },
                    { code: 'r', label: 'Rook', key: 'r' },
                    { code: 'b', label: 'Bishop', key: 'b' },
                    { code: 'n', label: 'Knight', key: 'n' },
                  ].map(pieceSelection => {
                    const fullCode = `${chess.turn()}${pieceSelection.code}`;
                    return (
                      <button
                        key={pieceSelection.code}
                        onClick={() => handlePromotionSelect(pieceSelection.code)}
                        className="w-16 h-16 p-2 bg-zinc-700 hover:bg-zinc-650 hover:scale-105 active:scale-95 rounded-lg border border-zinc-600 transition flex items-center justify-center shadow-md cursor-pointer"
                        title={pieceSelection.label}
                        id={`promotion-choice-${pieceSelection.code}`}
                      >
                        {PIECES_SVG[fullCode]}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
