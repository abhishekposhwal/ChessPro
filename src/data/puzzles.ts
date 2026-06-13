export interface Puzzle {
  id: string;
  title: string;
  description: string;
  clue: string;
  fen: string;
  turn: 'w' | 'b';
  solutionMoves: { from: string; to: string; promotion?: string }[];
  opponentMoves?: { from: string; to: string; promotion?: string }[];
}

export const CHESS_PUZZLES: Puzzle[] = [
  {
    id: 'puzzle_back_rank',
    title: 'Back Rank Defect',
    description: 'The black back rank is completely vulnerable. Punish with a mate in 1!',
    clue: 'Look for a long-distance rook move targeting the back row.',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    turn: 'w',
    solutionMoves: [{ from: 'd1', to: 'd8' }]
  },
  {
    id: 'puzzle_smothered',
    title: 'Smothered Mate',
    description: 'The black king is trapped by its own defenders. Find the single winning jump!',
    clue: 'Your knight on h6 has a perfect square to deliver checkmate.',
    fen: '6rk/5ppp/7N/8/8/8/8/6K1 w - - 0 1',
    turn: 'w',
    solutionMoves: [{ from: 'h6', to: 'f7' }]
  },
  {
    id: 'puzzle_scholars',
    title: "Scholar's Mate Trap",
    description: 'Your opponent developed poorly. Deliver checkmate immediately!',
    clue: 'Coordinate your queen and bishop to attack the weak f7 pawn.',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    turn: 'w',
    solutionMoves: [{ from: 'f3', to: 'f7' }]
  },
  {
    id: 'puzzle_fork',
    title: 'Royal Knight Fork',
    description: 'Black left their King and Queen vulnerable to a tactical fork. Win the Queen!',
    clue: 'Move your active Knight to a square checking the king, then prepare to capture the Queen.',
    fen: 'r3kbnr/ppp1pppp/3q4/3N4/8/8/PPPP1PPP/R1BQKBNR w KQkq - 0 1',
    turn: 'w',
    solutionMoves: [
      { from: 'd5', to: 'c7' },
      { from: 'c7', to: 'd6' }
    ],
    opponentMoves: [
      { from: 'e8', to: 'd8' }
    ]
  },
  {
    id: 'puzzle_philidor',
    title: "Philidor's Legacy",
    description: "Sacrifice your Queen to force Black's rook into a smothered mate trap!",
    clue: 'Puzzles can require a grand sacrifice. Look for a queen check that forces rook recapture.',
    fen: '6rk/5Qpp/7N/8/8/8/8/6K1 w - - 0 1',
    turn: 'w',
    solutionMoves: [
      { from: 'f7', to: 'g8' }, // Qg8+
      { from: 'h6', to: 'f7' }  // Nf7# smothered mate
    ],
    opponentMoves: [
      { from: 'g8', to: 'g8' } // Rxg8 recapture
    ]
  }
];
