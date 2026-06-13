export interface LessonStep {
  from: string;
  to: string;
  promotion?: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Rules' | 'Tactics' | 'Strategy';
  description: string;
  clue: string;
  fen: string;
  turn: 'w' | 'b';
  steps: LessonStep[];
}

export const CHESS_LESSONS: Lesson[] = [
  {
    id: 'lesson_pawn_promotion',
    title: 'Pawn Promotion',
    difficulty: 'Beginner',
    category: 'Rules',
    description: 'When a pawn reaches the opposite edge of the board (8th rank for White), it has the power to promote to a stronger piece - usually a Queen! Slide your pawn to the final row.',
    clue: 'Move the white pawn from e7 to e8, then select the Queen (q) promotion option.',
    fen: '8/4P3/8/k7/8/8/8/6K1 w - - 0 1',
    turn: 'w',
    steps: [
      {
        from: 'e7',
        to: 'e8',
        promotion: 'q',
        explanation: 'Excellent! Your pawn has upgraded into a powerful Queen, dominating the board.'
      }
    ]
  },
  {
    id: 'lesson_castling',
    title: 'King Safety (Castling)',
    difficulty: 'Beginner',
    category: 'Rules',
    description: 'Castling allows you to secure your King in a safe corner and activate your Rook in a single turn. Moving the King two squares towards the Rook triggers this special move automatically.',
    clue: 'Move your King two squares to the right: e1 to g1.',
    fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
    turn: 'w',
    steps: [
      {
        from: 'e1',
        to: 'g1',
        explanation: 'Perfect! The King jumped to g1 and the h1 Rook hopped over to f1. Your King is safe.'
      }
    ]
  },
  {
    id: 'lesson_en_passant',
    title: 'The En Passant Rule',
    difficulty: 'Intermediate',
    category: 'Rules',
    description: 'When an opponent pawn jumps two squares forward and lands right next to your pawn, you can capture it diagonally "in passing" as if it had only moved one square!',
    clue: 'Capture the black pawn diagonally. Move your pawn from f5 to g6 to execute En Passant.',
    fen: '8/8/8/5pP1/8/8/8/6K1 w - f6 0 1', // en passant target square is f6/g6 (black pawn moved f7-f5, so white g5 can capture on f6)
    turn: 'w',
    steps: [
      {
        from: 'g5',
        to: 'f6',
        explanation: 'Brilliant! You executed an En Passant capture. The black pawn on f5 is removed off the board!'
      }
    ]
  },
  {
    id: 'lesson_absolute_pin',
    title: 'Tactical Pin',
    difficulty: 'Intermediate',
    category: 'Tactics',
    description: 'An "absolute pin" is when a piece cannot move because doing so would expose their King to check. Use your Bishop to lock down the black Rook and win the trade!',
    clue: 'Slide your light-squared Bishop down to the long diagonal to line up with the King.',
    fen: '6k1/5r2/8/8/8/8/1B6/6K1 w - - 0 1',
    turn: 'w',
    steps: [
      {
        from: 'b2',
        to: 'e5',
        explanation: 'Superb! The black Rook on f7 is pinned against the King on g8. It can no longer move away safely and is yours!'
      }
    ]
  },
  {
    id: 'lesson_underpromotion',
    title: 'Strategic Underpromotion',
    difficulty: 'Advanced',
    category: 'Tactics',
    description: 'Sometimes, promoting to a Queen is a critical mistake because it instantly results in a Stalemate (no legal moves left, drawing the game). Promote to a Knight instead to deliver a checkmate fork!',
    clue: 'Advance your pawn on f7 to f8, but select a Knight (n) instead of a Queen!',
    fen: 'k7/P4P2/8/8/8/5N2/8/6K1 w - - 0 1',
    turn: 'w',
    steps: [
      {
        from: 'f7',
        to: 'f8',
        promotion: 'n',
        explanation: 'Incredible! Promoting to a Knight delivered direct check to the a8 King, avoiding stalemate and winning easily.'
      }
    ]
  }
];
