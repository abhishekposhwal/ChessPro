export type GameStatus =
  | 'waiting' // Lobby-state, waiting for Player 2
  | 'playing' // Active match
  | 'checkmate' // Game over by technical mate
  | 'stalemate' // Draw by no legal moves
  | 'draw-insufficient' // Draw because of material checkmate impossibility
  | 'draw-repetition' // Draw by threefold repetition
  | 'draw-agreement' // Mutual agreement
  | 'resign' // Resigned
  | 'timeout'; // Game clock elapsed

export type TimeControl = '1m' | '3m' | '5m' | '10m' | '30m' | 'untimed';

export interface ChessMove {
  from: string; // "e2"
  to: string; // "e4"
  piece: string; // "p", "r", "n", "b", "q", "k"
  color: 'w' | 'b';
  san: string; // "e4", "Nf3"
  promotion?: string; // "q" if promoted
  timestamp: number; // Milliseconds elapsed
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface GameState {
  gameId: string;
  whitePlayerId: string | null;
  whitePlayerName: string;
  blackPlayerId: string | null;
  blackPlayerName: string;
  status: GameStatus;
  fen: string; // Represents board configuration
  history: ChessMove[];
  turn: 'w' | 'b';
  winner: 'w' | 'b' | 'draw' | null;
  timeControl: TimeControl;
  initialTime?: number; // Initial clock duration in seconds
  whiteTimeRemaining?: number; // In seconds
  blackTimeRemaining?: number; // In seconds
  lastMoveTimestamp?: number; // Unix time when turn shifted
  drawOfferedBy?: string | null; // Player UID
  createdAt: number;
  updatedAt: number;
  isComputerGame?: boolean; // True if playing offline against engine or server-side Gemini
  computerDifficulty?: number; // 1-5 Difficulty or "gemini"
  isPrivate?: boolean; // If true, game won't show in public list
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  status: 'online' | 'offline';
  createdAt: number;
}
