import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import {
  isFirebaseConfigured,
  db,
  auth,
  signInWithGoogle,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  query,
  where,
  getDoc,
  deleteDoc,
  addDoc,
  getDocs,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import {
  Trophy,
  Users,
  Cpu,
  User,
  LogOut,
  Send,
  MessageSquare,
  Sparkles,
  Flag,
  ArrowRight,
  Handshake,
  Home,
  Bot,
  Flame,
  Volume2,
  VolumeX,
  Trash2,
  Copy,
} from 'lucide-react';
import Chessboard from './components/Chessboard';
import GameClock from './components/GameClock';
import MoveHistory from './components/MoveHistory';
import Lobby from './components/Lobby';
import { GameState, ChessMove, ChatMessage, UserProfile, TimeControl, GameStatus } from './types';
import { CHESS_PUZZLES, Puzzle } from './data/puzzles';
import { CHESS_LESSONS, Lesson } from './data/lessons';
import { CheckCircle2, AlertCircle, HelpCircle, BookOpen, Award, GraduationCap, Wifi, Activity, Globe, RefreshCw } from 'lucide-react';

export default function App() {
  // Authentication & Active User Profile
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [guestName, setGuestName] = useState<string>('Guest');

  // Active Game State (can be either Online Firestore sync, or Local Sandbox in-memory)
  const [game, setGame] = useState<GameState | null>(null);

  // Lists of records
  const [onlineOpenGames, setOnlineOpenGames] = useState<GameState[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  // Coaching & Analysis panel state (from server-side Gemini API)
  const [coachAnalysis, setCoachAnalysis] = useState<{
    evaluation: string;
    commentary: string;
    bestMove: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Play Sound toggles and helpers
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Puzzle Mode states
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [puzzleMoveIndex, setPuzzleMoveIndex] = useState<number>(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'solving' | 'failed' | 'solved'>('solving');
  const [showPuzzleClue, setShowPuzzleClue] = useState<boolean>(false);

  // Lesson Mode states
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonStepIndex, setLessonStepIndex] = useState<number>(0);
  const [lessonStatus, setLessonStatus] = useState<'learning' | 'failed' | 'completed'>('learning');
  const [showLessonClue, setShowLessonClue] = useState<boolean>(false);

  // Real-time server state metrics
  const [showServerStatus, setShowServerStatus] = useState(false);
  const [simulatedPing, setSimulatedPing] = useState(24);
  const [isRefreshingServer, setIsRefreshingServer] = useState(false);
  const [onlineCountBase, setOnlineCountBase] = useState(24102);
  const [realOnlineCount, setRealOnlineCount] = useState<number | null>(null);
  const [realTotalUsers, setRealTotalUsers] = useState<number | null>(null);
  const [firebaseSetupError, setFirebaseSetupError] = useState<string | null>(null);

  // Slowly fluctuate online count to simulate real traffic
  useEffect(() => {
    const timer = setInterval(() => {
      setOnlineCountBase(base => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const target = base + change;
        if (target < 24000) return 24020;
        if (target > 24200) return 24180;
        return target;
      });
      setSimulatedPing(ping => {
        const change = Math.floor(Math.random() * 5) - 2;
        const nextPing = ping + change;
        return Math.max(12, Math.min(65, nextPing));
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to real-time player states in Firestore users collection
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    try {
      const usersColRef = collection(db, 'users');
      const unsubscribe = onSnapshot(usersColRef, (snapshot) => {
        let online = 0;
        let total = 0;
        snapshot.forEach(docSnap => {
          const u = docSnap.data();
          total++;
          if (u.status === 'online') {
            online++;
          }
        });
        setRealOnlineCount(online);
        setRealTotalUsers(total);
      }, (error) => {
        console.warn("Error counting real users in Firestore:", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Failed to set up real-time user snapshot:", err);
    }
  }, []);

  const handleRefreshServerStats = () => {
    setIsRefreshingServer(true);
    setTimeout(() => {
      setIsRefreshingServer(false);
    }, 800);
  };

  // Local state references for keeping chats syncing or triggers
  const unsubscribeGameRef = useRef<(() => void) | null>(null);
  const unsubscribeChatRef = useRef<(() => void) | null>(null);

  // Play synthetic chess audio notes (no dependencies needed!)
  const playMoveSound = (captured = false) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (captured) {
        // High to low frequency double-tap for board captures
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        // Standard geometric chess tick
        osc.frequency.setValueAtTime(260, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {
      console.warn('Audio note fail', e);
    }
  };

  const playSolvedSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      
      osc1.start();
      osc2.start(audioCtx.currentTime + 0.12);
      osc1.stop(audioCtx.currentTime + 0.45);
      osc2.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio puzzle success error:', e);
    }
  };

  const playBuzzerSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn('Audio buzzer error:', e);
    }
  };

  const handleStartPuzzle = (puzzle?: Puzzle) => {
    const puzzleToLoad = puzzle || CHESS_PUZZLES[Math.floor(Math.random() * CHESS_PUZZLES.length)];
    
    const puzzleGameState: GameState = {
      gameId: `puzzle-${puzzleToLoad.id}-${Math.random().toString(36).substring(2, 6)}`,
      whitePlayerId: puzzleToLoad.turn === 'w' ? 'human' : 'computer',
      whitePlayerName: puzzleToLoad.turn === 'w' ? 'You' : 'Opponent',
      blackPlayerId: puzzleToLoad.turn === 'b' ? 'human' : 'computer',
      blackPlayerName: puzzleToLoad.turn === 'b' ? 'You' : 'Opponent',
      status: 'playing',
      fen: puzzleToLoad.fen,
      history: [],
      turn: puzzleToLoad.turn,
      winner: null,
      timeControl: 'untimed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isComputerGame: true,
    };

    setGame(puzzleGameState);
    setActivePuzzle(puzzleToLoad);
    setPuzzleMoveIndex(0);
    setPuzzleStatus('solving');
    setShowPuzzleClue(false);
    setChatMessages([]);
    setCoachAnalysis(null);
  };

  const handleResetPuzzle = () => {
    if (!activePuzzle) return;
    const puzzleGameState: GameState = {
      gameId: `puzzle-${activePuzzle.id}-${Math.random().toString(36).substring(2, 6)}`,
      whitePlayerId: activePuzzle.turn === 'w' ? 'human' : 'computer',
      whitePlayerName: activePuzzle.turn === 'w' ? 'You' : 'Opponent',
      blackPlayerId: activePuzzle.turn === 'b' ? 'human' : 'computer',
      blackPlayerName: activePuzzle.turn === 'b' ? 'You' : 'Opponent',
      status: 'playing',
      fen: activePuzzle.fen,
      history: [],
      turn: activePuzzle.turn,
      winner: null,
      timeControl: 'untimed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isComputerGame: true,
    };
    setGame(puzzleGameState);
    setPuzzleMoveIndex(0);
    setPuzzleStatus('solving');
    setShowPuzzleClue(false);
  };

  const handleNextPuzzle = () => {
    const candidates = CHESS_PUZZLES.filter(p => p.id !== activePuzzle?.id);
    const nextPuz = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : CHESS_PUZZLES[Math.floor(Math.random() * CHESS_PUZZLES.length)];
    handleStartPuzzle(nextPuz);
  };

  const handleStartLesson = (lesson?: Lesson) => {
    const lessonToLoad = lesson || CHESS_LESSONS[0];
    
    const lessonGameState: GameState = {
      gameId: `lesson-${lessonToLoad.id}-${Math.random().toString(36).substring(2, 6)}`,
      whitePlayerId: lessonToLoad.turn === 'w' ? 'human' : 'computer',
      whitePlayerName: lessonToLoad.turn === 'w' ? 'You' : 'Opponent',
      blackPlayerId: lessonToLoad.turn === 'b' ? 'human' : 'computer',
      blackPlayerName: lessonToLoad.turn === 'b' ? 'You' : 'Opponent',
      status: 'playing',
      fen: lessonToLoad.fen,
      history: [],
      turn: lessonToLoad.turn,
      winner: null,
      timeControl: 'untimed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isComputerGame: true,
    };

    setGame(lessonGameState);
    setActivePuzzle(null); // clear puzzle mode
    setActiveLesson(lessonToLoad);
    setLessonStepIndex(0);
    setLessonStatus('learning');
    setShowLessonClue(false);
    setChatMessages([]);
    setCoachAnalysis(null);
  };

  const handleResetLesson = () => {
    if (!activeLesson) return;
    const lessonGameState: GameState = {
      gameId: `lesson-${activeLesson.id}-${Math.random().toString(36).substring(2, 6)}`,
      whitePlayerId: activeLesson.turn === 'w' ? 'human' : 'computer',
      whitePlayerName: activeLesson.turn === 'w' ? 'You' : 'Opponent',
      blackPlayerId: activeLesson.turn === 'b' ? 'human' : 'computer',
      blackPlayerName: activeLesson.turn === 'b' ? 'You' : 'Opponent',
      status: 'playing',
      fen: activeLesson.fen,
      history: [],
      turn: activeLesson.turn,
      winner: null,
      timeControl: 'untimed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isComputerGame: true,
    };
    setGame(lessonGameState);
    setLessonStepIndex(0);
    setLessonStatus('learning');
    setShowLessonClue(false);
  };

  const handleNextLesson = () => {
    if (!activeLesson) return;
    const currentIndex = CHESS_LESSONS.findIndex(l => l.id === activeLesson.id);
    const nextIndex = (currentIndex + 1) % CHESS_LESSONS.length;
    handleStartLesson(CHESS_LESSONS[nextIndex]);
  };

  // 1. Monitor Authentication State on Boot
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // In guest solo sandboxed states, assign a random name
      const randId = Math.floor(1000 + Math.random() * 9000);
      setGuestName(`Slayer${randId}`);
      return;
    }

    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        setCurrentUser(user);
        
        // Define a fast fallback/initial profile immediately to make the UI interactive and avoid lockouts
        const initialProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || `Grandmaster${user.uid.substring(0, 4)}`,
          photoURL: user.photoURL || 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&auto=format&fit=crop&q=80',
          rating: 1200,
          gamesPlayed: 0,
          gamesWon: 0,
          status: 'online',
          createdAt: Date.now(),
        };
        setUserProfile(initialProfile);

        // Build or Fetch details in Firestore User Profile
        const userRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile({ ...data, status: 'online' });
            await setDoc(userRef, { status: 'online' }, { merge: true });
          } else {
            // Register new user profile in db
            await setDoc(userRef, initialProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile from Firestore:', error);
          setFirebaseSetupError('Missing or insufficient permissions reading user profile. Ensure firestore.rules is deployed!');
          try {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          } catch (e) {
            console.error('Captured diagnostic throw:', e);
          }
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        // Automatically authenticate user anonymously to ensure seamless Online multiplayer
        signInAnonymously(auth).catch(err => {
          console.warn('Anonymous login on boot failed:', err);
          setFirebaseSetupError('Anonymous Authentication provider is disabled. Please enable it in your Firebase console!');
        });
      }
    });

    return () => unsub();
  }, []);

  // Update online status in Firestore dynamically and handle page close/unmount
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !currentUser) return;
    
    // Set status to online on mount/change
    const userRef = doc(db, 'users', currentUser.uid);
    updateDoc(userRef, { status: 'online' }).catch(() => {});

    const keepOnlineInterval = setInterval(() => {
      // Periodic heartbeat to make sure they remain online
      updateDoc(userRef, { status: 'online' }).catch(() => {});
    }, 30000);

    const handleBeforeUnload = () => {
      // Set to offline before tab closes
      updateDoc(userRef, { status: 'offline' }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(keepOnlineInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateDoc(userRef, { status: 'offline' }).catch(() => {});
    };
  }, [currentUser]);

  // 2. Real-time Subscription to Public Lobby Open Rooms (when authenticated and Firebase connected)
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !currentUser) return;

    const gamesCol = collection(db, 'games');
    const waitingQuery = query(gamesCol, where('status', '==', 'waiting'));

    const unsub = onSnapshot(
      waitingQuery,
      snapshot => {
        const rooms: GameState[] = [];
        snapshot.forEach(docSnap => {
          const gameData = docSnap.data() as GameState;
          if (gameData.isPrivate !== true) {
            rooms.push(gameData);
          }
        });
        setOnlineOpenGames(rooms);
      },
      error => {
        console.error('Firestore Lobby Snapshot failed:', error);
        setFirebaseSetupError('Missing or insufficient permissions listing open games. Ensure firestore.rules is deployed!');
        try {
          handleFirestoreError(error, OperationType.LIST, 'games');
        } catch (e) {
          console.error('Captured diagnostic throw:', e);
        }
      }
    );

    return () => unsub();
  }, [currentUser]);

  // 3. Local Engine Move Calculator (Supports difficulty 1-4 algorithmic chess AI)
  const calculateLocalEngineMove = (currentFen: string, difficulty: number): ChessMove | null => {
    const localChessObj = new Chess(currentFen);
    const moves = localChessObj.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Weighting factor: higher difficulty plays stronger tactical moves
    // Simple heuristic scorer: Kings/Queens/Rooks highest index
    const scorePiece = (pieceType: string) => {
      switch (pieceType) {
        case 'q': return 90;
        case 'r': return 50;
        case 'b': return 30;
        case 'n': return 30;
        case 'p': return 10;
        default: return 0;
      }
    };

    const evaluatedMoves = moves.map(move => {
      let score = 0;
      // Capture benefits
      if (move.captured) {
        score += scorePiece(move.captured) * 10;
      }
      // Promotion benefits
      if (move.flags.includes('p')) {
        score += 80;
      }
      // Castling benefits
      if (move.flags.includes('k') || move.flags.includes('q')) {
        score += 20;
      }
      // Add standard checks
      localChessObj.move(move.san);
      if (localChessObj.inCheck()) {
        score += 15;
      }
      localChessObj.undo();

      // Induce a tiny factor of random noise depending on difficulty (Lvl 1 has high noise, Lvl 4 has low noise)
      const noiseRange = Math.max(0, (5 - difficulty) * 30);
      const randomNoise = (Math.random() - 0.5) * noiseRange;

      return { move, totalScore: score + randomNoise };
    });

    // Sort by computed heuristic scores
    evaluatedMoves.sort((a, b) => b.totalScore - a.totalScore);

    const chosen = evaluatedMoves[0].move;
    return {
      from: chosen.from,
      to: chosen.to,
      san: chosen.san,
      color: chosen.color as 'w' | 'b',
      piece: chosen.piece,
      promotion: chosen.promotion,
      timestamp: Date.now(),
    };
  };

  // 4. Trigger Computer Chess Turn (Algorithmic Local or Gemini Server-Side Agent Lvl 5 / Difficulty "gemini")
  const triggerComputerMove = async (currentGameState: GameState) => {
    if (currentGameState.status !== 'playing') return;

    const localChessObj = new Chess(currentGameState.fen);
    if (localChessObj.turn() !== currentGameState.turn) return; // Verify turn sync

    // If it is the computer's active turn, evaluate
    const isWhiteComputer = currentGameState.whitePlayerId === 'computer';
    const isBlackComputer = currentGameState.blackPlayerId === 'computer';

    const isComputerTurn =
      (currentGameState.turn === 'w' && isWhiteComputer) || (currentGameState.turn === 'b' && isBlackComputer);

    if (!isComputerTurn) return;

    // Add a slight latency to simulate calculation and feel natural
    await new Promise(resolve => setTimeout(resolve, 800));

    const level = currentGameState.computerDifficulty || 3;

    let computed: ChessMove | null = null;

    if (level === 5) {
      // Prompt Gemini Server Agent for Move selection
      try {
        const rawLegal = localChessObj.moves({ verbose: true });
        const cleanMoves = rawLegal.map(m => ({ from: m.from, to: m.to, san: m.san, promotion: m.promotion }));

        const response = await fetch('/api/ai/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fen: currentGameState.fen,
            history: currentGameState.history,
            difficulty: 5,
            legalMoves: cleanMoves,
          }),
        });

        if (response.ok) {
          const moveData = await response.json();
          computed = {
            from: moveData.from,
            to: moveData.to,
            san: moveData.san,
            piece: moveData.piece || 'p',
            color: currentGameState.turn,
            promotion: moveData.promotion,
            timestamp: Date.now(),
          };
        } else {
          computed = calculateLocalEngineMove(currentGameState.fen, 3);
        }
      } catch (err) {
        console.error('Failed to trigger Gemini move api:', err);
        computed = calculateLocalEngineMove(currentGameState.fen, 3);
      }
    } else {
      // Use efficient local heuristic evaluation
      computed = calculateLocalEngineMove(currentGameState.fen, level);
    }

    if (!computed) return;

    // Apply the computer's move securely
    applyMove(computed.from, computed.to, computed.promotion);
  };

  // 5. Apply Chess movement locally AND dispatch to server if Online Room
  const applyMove = async (from: string, to: string, promotion?: string) => {
    if (!game) return;

    if (activeLesson) {
      const currentExpectedMove = activeLesson.steps[lessonStepIndex];
      const isCorrectMove =
        currentExpectedMove &&
        currentExpectedMove.from.toLowerCase() === from.toLowerCase() &&
        currentExpectedMove.to.toLowerCase() === to.toLowerCase() &&
        (!currentExpectedMove.promotion || currentExpectedMove.promotion === promotion);

      if (isCorrectMove) {
        setLessonStatus('learning');
        const localChessObj = new Chess(game.fen);
        try {
          const moveResult = localChessObj.move({ from, to, promotion });
          if (!moveResult) return;

          playMoveSound(!!moveResult.captured);

          const activeMove: ChessMove = {
            from,
            to,
            san: moveResult.san,
            piece: moveResult.piece,
            color: moveResult.color,
            promotion: promotion || null,
            timestamp: Date.now(),
          };
          const updatedHistory = [...game.history, activeMove];

          const nextIndex = lessonStepIndex + 1;
          const totalSteps = activeLesson.steps.length;

          if (nextIndex >= totalSteps) {
            setLessonStatus('completed');
            playSolvedSound();
            const solvedState: GameState = {
              ...game,
              fen: localChessObj.fen(),
              history: updatedHistory,
              status: 'stalemate',
              winner: 'w',
              updatedAt: Date.now(),
            };
            setGame(solvedState);
            setLessonStepIndex(nextIndex);

            if (userProfile) {
              setUserProfile({ ...userProfile, rating: userProfile.rating + 10 });
            }
          } else {
            setLessonStepIndex(nextIndex);
            const midState: GameState = {
              ...game,
              fen: localChessObj.fen(),
              history: updatedHistory,
              updatedAt: Date.now(),
            };
            setGame(midState);
          }
        } catch (e) {
          console.warn('Lesson step application error', e);
        }
      } else {
        setLessonStatus('failed');
        playBuzzerSound();
      }
      return;
    }

    if (activePuzzle) {
      const currentExpectedMove = activePuzzle.solutionMoves[puzzleMoveIndex];
      const isCorrectMove =
        currentExpectedMove &&
        currentExpectedMove.from.toLowerCase() === from.toLowerCase() &&
        currentExpectedMove.to.toLowerCase() === to.toLowerCase() &&
        (!currentExpectedMove.promotion || currentExpectedMove.promotion === promotion);

      if (isCorrectMove) {
        setPuzzleStatus('solving');
        const localChessObj = new Chess(game.fen);
        try {
          const moveResult = localChessObj.move({ from, to, promotion });
          if (!moveResult) return;

          playMoveSound(!!moveResult.captured);

          const activeMove: ChessMove = {
            from,
            to,
            san: moveResult.san,
            piece: moveResult.piece,
            color: moveResult.color,
            promotion: promotion || null,
            timestamp: Date.now(),
          };
          const updatedHistory = [...game.history, activeMove];

          const nextIndex = puzzleMoveIndex + 1;
          const totalSteps = activePuzzle.solutionMoves.length;

          if (nextIndex >= totalSteps) {
            setPuzzleStatus('solved');
            playSolvedSound();
            const solvedState: GameState = {
              ...game,
              fen: localChessObj.fen(),
              history: updatedHistory,
              status: 'stalemate',
              winner: 'w',
              updatedAt: Date.now(),
            };
            setGame(solvedState);
            setPuzzleMoveIndex(nextIndex);

            if (userProfile) {
              setUserProfile({ ...userProfile, rating: userProfile.rating + 15 });
            }
          } else {
            const opponentMove = activePuzzle.opponentMoves?.[puzzleMoveIndex];
            if (opponentMove) {
              const midState: GameState = {
                ...game,
                fen: localChessObj.fen(),
                history: updatedHistory,
                updatedAt: Date.now(),
              };
              setGame(midState);
              setPuzzleMoveIndex(nextIndex);

              setTimeout(() => {
                try {
                  const oppChess = new Chess(localChessObj.fen());
                  const oppMoveResult = oppChess.move({
                    from: opponentMove.from,
                    to: opponentMove.to,
                    promotion: opponentMove.promotion,
                  });
                  if (oppMoveResult) {
                    playMoveSound(!!oppMoveResult.captured);
                    const oppActiveMove: ChessMove = {
                      from: opponentMove.from,
                      to: opponentMove.to,
                      san: oppMoveResult.san,
                      piece: oppMoveResult.piece,
                      color: oppMoveResult.color,
                      promotion: opponentMove.promotion || null,
                      timestamp: Date.now(),
                    };
                    const finalState: GameState = {
                      ...game,
                      fen: oppChess.fen(),
                      history: [...updatedHistory, oppActiveMove],
                      updatedAt: Date.now(),
                    };
                    setGame(finalState);
                  }
                } catch (err) {
                  console.warn('Opponent reply error', err);
                }
              }, 600);
            } else {
              setPuzzleStatus('solved');
              playSolvedSound();
              const solvedState: GameState = {
                ...game,
                fen: localChessObj.fen(),
                history: updatedHistory,
                status: 'stalemate',
                winner: 'w',
                updatedAt: Date.now(),
              };
              setGame(solvedState);
              setPuzzleMoveIndex(nextIndex);
            }
          }
        } catch (e) {
          console.warn('Puzzle validation move apply failed', e);
        }
      } else {
        setPuzzleStatus('failed');
        playBuzzerSound();
      }
      return;
    }

    const localChessObj = new Chess(game.fen);
    try {
      const moveResult = localChessObj.move({ from, to, promotion });
      if (!moveResult) return;

      const capturedSound = !!moveResult.captured;
      playMoveSound(capturedSound);

      // Determine updated game status conditions based on Chess.js rules
      let updatedStatus: GameStatus = 'playing';
      let winner: 'w' | 'b' | 'draw' | null = null;

      if (localChessObj.isGameOver()) {
        if (localChessObj.isCheckmate()) {
          updatedStatus = 'checkmate';
          winner = localChessObj.turn() === 'w' ? 'b' : 'w'; // Side whose turn was next lost
        } else if (localChessObj.isDraw()) {
          winner = 'draw';
          if (localChessObj.isStalemate()) {
            updatedStatus = 'stalemate';
          } else if (localChessObj.isInsufficientMaterial()) {
            updatedStatus = 'draw-insufficient';
          } else if (localChessObj.isThreefoldRepetition()) {
            updatedStatus = 'draw-repetition';
          } else {
            updatedStatus = 'draw-agreement';
          }
        }
      }

      const activeMove: ChessMove = {
        from,
        to,
        san: moveResult.san,
        piece: moveResult.piece,
        color: moveResult.color,
        promotion: promotion || null,
        timestamp: Date.now(),
      };

      const nextTurn = localChessObj.turn() as 'w' | 'b';
      const updatedHistory = [...game.history, activeMove];

      // Clock calculations if using time controls
      let whiteRemaining = game.whiteTimeRemaining;
      let blackRemaining = game.blackTimeRemaining;
      const moveEpoch = Date.now();

      if (game.timeControl !== 'untimed' && game.lastMoveTimestamp) {
        const secondsUsed = (moveEpoch - game.lastMoveTimestamp) / 1000;
        // The side who JUST moved has their clock depleted
        if (game.turn === 'w' && whiteRemaining !== undefined) {
          whiteRemaining = Math.max(0, whiteRemaining - secondsUsed);
        } else if (game.turn === 'b' && blackRemaining !== undefined) {
          blackRemaining = Math.max(0, blackRemaining - secondsUsed);
        }
      }

      const nextState: GameState = {
        ...game,
        fen: localChessObj.fen(),
        history: updatedHistory,
        turn: nextTurn,
        status: updatedStatus,
        winner,
        whiteTimeRemaining: whiteRemaining,
        blackTimeRemaining: blackRemaining,
        lastMoveTimestamp: moveEpoch,
        updatedAt: moveEpoch,
      };

      // Reset local coaching analytics to prevent stales
      setCoachAnalysis(null);

      const isLocalGame = game.isComputerGame || game.gameId === 'local-pass-play' || game.gameId.startsWith('local-');
      if (isLocalGame) {
        setGame(nextState);
      } else if (isFirebaseConfigured && db) {
        // Optimistic UI updates - render the move instantly for unmatched responsiveness
        setGame(nextState);

        // Broadcast immediately to Firestore Online Room Document
        const gameRef = doc(db, 'games', game.gameId);
        try {
          await updateDoc(gameRef, {
            fen: nextState.fen,
            history: nextState.history,
            turn: nextState.turn,
            status: nextState.status,
            winner: nextState.winner,
            whiteTimeRemaining: nextState.whiteTimeRemaining || null,
            blackTimeRemaining: nextState.blackTimeRemaining || null,
            lastMoveTimestamp: nextState.lastMoveTimestamp || null,
            updatedAt: nextState.updatedAt,
          });
        } catch (err) {
          console.warn('Online move synchronization failed, rolling back:', err);
          handleFirestoreError(err, OperationType.UPDATE, `games/${game.gameId}`);
        }
      }
    } catch (e) {
      console.warn('Rejected irregular move:', e);
    }
  };

  // Monitor computer turns in active local matches
  useEffect(() => {
    if (game && game.isComputerGame && game.status === 'playing') {
      triggerComputerMove(game);
    }
  }, [game]);

  // 6. Clock Timeout Event Dispatcher
  const handleClockTimeout = async (loserColor: 'w' | 'b') => {
    if (!game || game.status !== 'playing') return;

    const winnerColor = loserColor === 'w' ? 'b' : 'w';
    const finalState: Partial<GameState> = {
      status: 'timeout',
      winner: winnerColor,
      updatedAt: Date.now(),
    };

    if (game.isComputerGame) {
      setGame(prev => (prev ? { ...prev, ...finalState } : null));
    } else if (isFirebaseConfigured && db) {
      const gameRef = doc(db, 'games', game.gameId);
      try {
        await updateDoc(gameRef, finalState);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `games/${game.gameId}`);
      }
    }
  };

  // 7. Request Positional Grandmaster Coach Analysis (Gemini Endpoint API)
  const triggerCoachReview = async () => {
    if (!game) return;
    setIsAnalyzing(true);
    setCoachAnalysis(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: game.fen,
          history: game.history,
          sideToAnalyze: game.turn,
        }),
      });

      if (response.ok) {
        const review = await response.json();
        setCoachAnalysis(review);
      } else {
        setCoachAnalysis({
          evaluation: 'Error',
          commentary: 'Failed to access Gemini Coach. Please check your developer API keys.',
          bestMove: 'N/A',
        });
      }
    } catch (error) {
      console.error('Coaching query failed:', error);
      setCoachAnalysis({
        evaluation: 'Error',
        commentary: 'Network stutters. Make sure to restart dev server or provide an active internet connection.',
        bestMove: 'N/A',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 8. Matchmaking: Host/Create Game Room in Firestore
  const handleCreateOnlineRoom = async (
    timeControl: TimeControl,
    preferredColor: 'w' | 'b' | 'random',
    playerName: string,
    isPrivate?: boolean
  ) => {
    if (!isFirebaseConfigured || !db || !currentUser) return;

    // Sync display name with userProfile in Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(userRef, {
        uid: currentUser.uid,
        displayName: playerName,
        photoURL: userProfile?.photoURL || 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&auto=format&fit=crop&q=80',
        rating: userProfile?.rating || 1200,
        gamesPlayed: userProfile?.gamesPlayed || 0,
        gamesWon: userProfile?.gamesWon || 0,
        status: 'online',
        createdAt: userProfile?.createdAt || Date.now(),
      }, { merge: true });
      
      setUserProfile(prev => prev ? { ...prev, displayName: playerName } : {
        uid: currentUser.uid,
        displayName: playerName,
        photoURL: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&auto=format&fit=crop&q=80',
        rating: 1200,
        gamesPlayed: 0,
        gamesWon: 0,
        status: 'online',
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn('Profile name sync failed:', err);
    }

    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const existingHosted = JSON.parse(localStorage.getItem('hosted_game_ids') || '[]');
      if (!existingHosted.includes(randomId)) {
        existingHosted.push(randomId);
        localStorage.setItem('hosted_game_ids', JSON.stringify(existingHosted));
      }
    } catch (e) {
      console.warn('Failed to save hosted gameId locally:', e);
    }

    const sideColor =
      preferredColor === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : preferredColor;

    let totalSecs = undefined;
    if (timeControl === '1m') totalSecs = 60;
    else if (timeControl === '3m') totalSecs = 180;
    else if (timeControl === '5m') totalSecs = 300;
    else if (timeControl === '10m') totalSecs = 600;
    else if (timeControl === '30m') totalSecs = 1800;

    const initialRoom: GameState = {
      gameId: randomId,
      whitePlayerId: sideColor === 'w' ? currentUser.uid : null,
      whitePlayerName: sideColor === 'w' ? playerName : '',
      blackPlayerId: sideColor === 'b' ? currentUser.uid : null,
      blackPlayerName: sideColor === 'b' ? playerName : '',
      status: 'waiting',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // starting position
      history: [],
      turn: 'w',
      winner: null,
      timeControl,
      whiteTimeRemaining: totalSecs !== undefined ? totalSecs : null,
      blackTimeRemaining: totalSecs !== undefined ? totalSecs : null,
      lastMoveTimestamp: Date.now(),
      drawOfferedBy: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPrivate: !!isPrivate,
    };

    const docRef = doc(db, 'games', randomId);
    try {
      await setDoc(docRef, initialRoom);
      // Join the room as dynamic host listener
      subscribeToOnlineGame(randomId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `games/${randomId}`);
    }
  };

  // 9. Matchmaking: Fight/Join existing public waiting Game Room
  const handleJoinOnlineRoom = async (gameId: string, opponentPlayerName: string) => {
    if (!isFirebaseConfigured || !db || !currentUser) return;

    // Sync display name with userProfile in Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(userRef, {
        uid: currentUser.uid,
        displayName: opponentPlayerName,
        photoURL: userProfile?.photoURL || 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&auto=format&fit=crop&q=80',
        rating: userProfile?.rating || 1200,
        gamesPlayed: userProfile?.gamesPlayed || 0,
        gamesWon: userProfile?.gamesWon || 0,
        status: 'online',
        createdAt: userProfile?.createdAt || Date.now(),
      }, { merge: true });
      
      setUserProfile(prev => prev ? { ...prev, displayName: opponentPlayerName } : {
        uid: currentUser.uid,
        displayName: opponentPlayerName,
        photoURL: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&auto=format&fit=crop&q=80',
        rating: 1200,
        gamesPlayed: 0,
        gamesWon: 0,
        status: 'online',
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn('Profile name sync failed:', err);
    }

    const gameRef = doc(db, 'games', gameId);
    try {
      const snap = await getDoc(gameRef);
      if (!snap.exists()) {
        alert("This Room Code is invalid or has expired.");
        return;
      }

      const gameData = snap.data() as GameState;
      let finalUpdate: Partial<GameState> = {};

      if (gameData.whitePlayerId === currentUser.uid || gameData.blackPlayerId === currentUser.uid) {
        // Already registered as player, just subscribe to game state
        subscribeToOnlineGame(gameId);
        return;
      }

      if (gameData.whitePlayerId === null) {
        finalUpdate = {
          whitePlayerId: currentUser.uid,
          whitePlayerName: opponentPlayerName,
          status: 'playing',
          lastMoveTimestamp: Date.now(),
          updatedAt: Date.now(),
        };
      } else if (gameData.blackPlayerId === null) {
        finalUpdate = {
          blackPlayerId: currentUser.uid,
          blackPlayerName: opponentPlayerName,
          status: 'playing',
          lastMoveTimestamp: Date.now(),
          updatedAt: Date.now(),
        };
      } else {
        alert("This Chess room is already occupied/full!");
        return;
      }

      await updateDoc(gameRef, finalUpdate);
      subscribeToOnlineGame(gameId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  // Delete hosted matchmaking game room from Firestore
  const handleDeleteOnlineGame = async (gameId: string) => {
    if (!isFirebaseConfigured || !db || !currentUser) return;
    try {
      const gameRef = doc(db, 'games', gameId);
      await deleteDoc(gameRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${gameId}`);
    }
  };

  // 10. Start Solitary Offline Vs Computer Match
  const handleStartComputerGame = (difficulty: number, sideColor: 'w' | 'b' | 'random') => {
    const finalSide = sideColor === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : sideColor;

    const computerState: GameState = {
      gameId: `local-cpu-${Math.random().toString(36).substring(2, 6)}`,
      whitePlayerId: finalSide === 'w' ? 'human' : 'computer',
      whitePlayerName: finalSide === 'w' ? 'Guest' : `Engine Level ${difficulty}`,
      blackPlayerId: finalSide === 'b' ? 'human' : 'computer',
      blackPlayerName: finalSide === 'b' ? 'Guest' : `Engine Level ${difficulty}`,
      status: 'playing',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      history: [],
      turn: 'w',
      winner: null,
      timeControl: 'untimed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isComputerGame: true,
      computerDifficulty: difficulty,
    };

    setGame(computerState);
    setChatMessages([]);
    setCoachAnalysis(null);
  };

  // 11. Start Local Pass & Play Match Sandbox
  const handleStartLocalGame = () => {
    const passAndPlayState: GameState = {
      gameId: 'local-pass-play',
      whitePlayerId: 'human-white',
      whitePlayerName: 'Player White (Local)',
      blackPlayerId: 'human-black',
      blackPlayerName: 'Player Black (Local)',
      status: 'playing',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      history: [],
      turn: 'w',
      winner: null,
      timeControl: 'untimed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isComputerGame: true,
    };

    setGame(passAndPlayState);
    setChatMessages([]);
    setCoachAnalysis(null);
  };

  // 12. Listen/Subscription to Live Game modifications in Firestore
  const subscribeToOnlineGame = (gameId: string) => {
    // Unsubscribe from any previous listeners to prevent leakage
    if (unsubscribeGameRef.current) unsubscribeGameRef.current();
    if (unsubscribeChatRef.current) unsubscribeChatRef.current();

    const gameDocRef = doc(db, 'games', gameId);
    unsubscribeGameRef.current = onSnapshot(
      gameDocRef,
      snap => {
        if (snap.exists()) {
          const updatedGame = snap.data() as GameState;
          setGame(updatedGame);

          // Sound effect on remote move shifts
          if (updatedGame.history.length > 0) {
            playMoveSound();
          }
        } else {
          setGame(null);
        }
      },
      error => {
        setFirebaseSetupError('Missing or insufficient permissions loading active game. Please check your firestore.rules!');
        try {
          handleFirestoreError(error, OperationType.GET, `games/${gameId}`);
        } catch (e) {
          console.error('Captured diagnostic throw:', e);
        }
      }
    );

    // Chat subcollection real-time message feeds sync
    const chatColRef = collection(db, 'games', gameId, 'messages');
    unsubscribeChatRef.current = onSnapshot(
      chatColRef,
      snap => {
        const messages: ChatMessage[] = [];
        snap.forEach(mSnap => {
          messages.push(mSnap.data() as ChatMessage);
        });
        messages.sort((a, b) => a.createdAt - b.createdAt);
        setChatMessages(messages);
      },
      error => {
        setFirebaseSetupError('Missing or insufficient permissions reading game chat messages. Please check your firestore.rules!');
        try {
          handleFirestoreError(error, OperationType.LIST, `games/${gameId}/messages`);
        } catch (e) {
          console.error('Captured diagnostic throw:', e);
        }
      }
    );
  };

  // Send message inside Online Room Live chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !game || game.isComputerGame) return;

    const messagePayload: ChatMessage = {
      id: Math.random().toString(36).substring(2, 8),
      senderId: currentUser?.uid || 'anonymous',
      senderName: userProfile?.displayName || guestName,
      text: chatInput.trim(),
      createdAt: Date.now(),
    };

    const chatDocRef = doc(db, 'games', game.gameId, 'messages', messagePayload.id);
    try {
      setChatInput('');
      await setDoc(chatDocRef, messagePayload);
    } catch (err) {
      console.warn('Silent chat discard:', err);
    }
  };

  // Game Action triggers: Offer draw, accept draw, or resign active match
  const handleResign = async () => {
    if (!game) return;

    let finalWinner: 'w' | 'b' = 'w';
    if (game.whitePlayerId === currentUser?.uid || game.whitePlayerId === 'human' || game.whitePlayerId === 'human-white') {
      finalWinner = 'b'; // White resigned, black wins
    } else {
      finalWinner = 'w'; // Black resigned, white wins
    }

    const resignedState: Partial<GameState> = {
      status: 'resign',
      winner: finalWinner,
      updatedAt: Date.now(),
    };

    if (game.isComputerGame) {
      setGame(prev => (prev ? { ...prev, ...resignedState } : null));
    } else if (isFirebaseConfigured && db) {
      const gameRef = doc(db, 'games', game.gameId);
      try {
        await updateDoc(gameRef, resignedState);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `games/${game.gameId}`);
      }
    }
  };

  const handleOfferDraw = async () => {
    if (!game || game.isComputerGame) return;

    if (isFirebaseConfigured && db) {
      const gameRef = doc(db, 'games', game.gameId);
      try {
        await updateDoc(gameRef, {
          drawOfferedBy: currentUser?.uid || null,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `games/${game.gameId}`);
      }
    }
  };

  const handleAcceptDraw = async () => {
    if (!game || game.isComputerGame) return;

    const finalDrawState: Partial<GameState> = {
      status: 'draw-agreement',
      winner: 'draw',
      drawOfferedBy: null,
      updatedAt: Date.now(),
    };

    if (isFirebaseConfigured && db) {
      const gameRef = doc(db, 'games', game.gameId);
      try {
        await updateDoc(gameRef, finalDrawState);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `games/${game.gameId}`);
      }
    }
  };

  // Exit game room returning to the Lobby
  const handleExitToLobby = () => {
    if (unsubscribeGameRef.current) unsubscribeGameRef.current();
    if (unsubscribeChatRef.current) unsubscribeChatRef.current();
    setGame(null);
    setChatMessages([]);
    setCoachAnalysis(null);
    setActivePuzzle(null);
    setPuzzleMoveIndex(0);
    setPuzzleStatus('solving');
    setShowPuzzleClue(false);
    setActiveLesson(null);
    setLessonStepIndex(0);
    setLessonStatus('learning');
    setShowLessonClue(false);
  };

  // Cancel hosted match request and delete game from Firestore
  const handleCancelHostedMatch = async () => {
    if (!game) return;
    if (isFirebaseConfigured && db && game.status === 'waiting') {
      try {
        const gameRef = doc(db, 'games', game.gameId);
        await deleteDoc(gameRef);
      } catch (err) {
        console.warn("Failed to delete hosted match from Firestore:", err);
      }
    }
    handleExitToLobby();
  };

  // Social Google Authentication or Anonymous Trigger
  const handleAuthButton = async () => {
    if (currentUser) {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } else {
      setFirebaseSetupError(null);
      try {
        await signInWithGoogle();
      } catch (e: any) {
        console.error('Google popup Auth failed, trying anonymous login...', e);
        if (e && e.code === 'auth/unauthorized-domain') {
          setFirebaseSetupError(`Unauthorized Domain: Please add "${window.location.hostname}" to your Firebase Console > Authentication > Settings > Authorized domains list, or run 'set_up_firebase' to reconfigure your environment credentials if needed.`);
        } else {
          setFirebaseSetupError(`Google Auth login failed: ${e?.message || String(e)}. Ensure Google Provider is enabled in your Firebase console under Authentication > Sign-in method.`);
        }
        try {
          const userCred = await signInAnonymously(auth);
          setCurrentUser(userCred.user);
        } catch (err: any) {
          console.error('Both logins failed. Using browser guest mode!');
          if (err && err.code === 'auth/admin-restricted-operation') {
            setFirebaseSetupError(prev => prev ? `${prev} Additionally, Anonymous Auth is currently disabled in your project console.` : 'Anonymous Auth is currently disabled in your project console. Please enable both "Google" and "Anonymous" in Firebase Console > Authentication > Sign-in method.');
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#161512] text-zinc-155 flex flex-col font-sans select-none overflow-x-hidden pb-4">
      {/* Premium Chess.com High Density Navigation Header */}
      <nav className="h-12 bg-[#262421] border-b border-[#312e2b] flex items-center justify-between px-6 shrink-0 sticky top-0 z-40 shadow-sm text-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleExitToLobby}>
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center font-bold text-white text-xs">C</div>
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
              CHESS
              <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold bg-[#312e2b] px-1.5 py-0.5 rounded ml-1">
                PRO
              </span>
            </span>
          </div>
          <div className="hidden md:flex gap-5 text-xs font-semibold text-gray-400">
            <button onClick={handleExitToLobby} className="hover:text-white transition cursor-pointer">Play</button>
            <button onClick={() => handleStartPuzzle()} className="hover:text-white transition cursor-pointer text-left">Puzzles</button>
            <button onClick={() => handleStartLesson()} className="hover:text-white transition cursor-pointer text-left">Learn</button>
            <button onClick={handleExitToLobby} className="text-white border-b-2 border-green-500 pb-3 pt-3 translate-y-[2px] transition shrink-0 font-bold hover:text-white">Live Chess</button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="hidden sm:flex items-center gap-2 bg-[#312e2b]/50 border border-[#3d3a37] px-2.5 py-1 rounded text-zinc-300 hover:bg-[#3d3a37]/80 hover:text-white transition cursor-pointer select-none relative transform scale-90" onClick={() => setShowServerStatus(prev => !prev)}>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span>
              {realOnlineCount !== null
                ? `${realOnlineCount} Online`
                : `${onlineCountBase.toLocaleString()} Online`
              }
            </span>

            {showServerStatus && (
              <div 
                className="absolute top-8 right-0 w-64 bg-[#262421] border border-[#3d3a37] text-zinc-300 rounded shadow-xl p-3.5 z-50 text-left cursor-default transform translate-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#312e2b] pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-green-400" />
                    <span className="font-bold text-[10px] tracking-wider uppercase text-zinc-400">Server Metrics</span>
                  </div>
                  <button 
                    onClick={handleRefreshServerStats} 
                    className="p-1 text-zinc-400 hover:text-green-500 hover:bg-[#3d3a37] rounded transition cursor-pointer"
                    title="Refresh connection"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingServer ? 'animate-spin text-green-500' : ''}`} />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center bg-[#161512]/40 p-1.5 rounded">
                    <span className="text-zinc-500 flex items-center gap-1"><Activity className="w-3 h-3" /> Status</span>
                    <span className="font-bold text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Operational
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#161512]/40 p-1.5 rounded">
                    <span className="text-zinc-500 flex items-center gap-1"><Globe className="w-3 h-3" /> DB Link</span>
                    <span className="font-semibold text-zinc-200">
                      {isFirebaseConfigured ? 'Firebase Cloud' : 'Local Sandbox'}
                    </span>
                  </div>

                  {realOnlineCount !== null && (
                    <div className="flex justify-between items-center bg-[#161512]/40 p-1.5 rounded">
                      <span className="text-zinc-500">Real-time Online</span>
                      <span className="font-mono bg-[#312e2b] px-1.5 py-0.5 rounded text-green-400 font-semibold text-[10px]">
                        {realOnlineCount} {realOnlineCount === 1 ? 'user' : 'users'}
                      </span>
                    </div>
                  )}

                  {realTotalUsers !== null && (
                    <div className="flex justify-between items-center bg-[#161512]/40 p-1.5 rounded">
                      <span className="text-zinc-500 font-medium">Registered Pool</span>
                      <span className="font-mono bg-[#312e2b] px-1.5 py-0.5 rounded text-purple-400 font-bold text-[10px]">
                        {realTotalUsers} players
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center bg-[#161512]/40 p-1.5 rounded">
                    <span className="text-zinc-500">Lobby Waiting</span>
                    <span className="font-mono bg-[#312e2b] px-1.5 py-0.5 rounded text-yellow-500 font-semibold text-[10px]">
                      {onlineOpenGames.length} rooms
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#161512]/40 p-1.5 rounded">
                    <span className="text-zinc-500">Latency</span>
                    <span className={`font-mono font-semibold ${simulatedPing > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {isRefreshingServer ? '...' : `${simulatedPing}ms`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#161512]/40 p-1.5 rounded">
                    <span className="text-zinc-500">Identity Mode</span>
                    <span className="text-zinc-300 font-bold truncate max-w-[120px]" title={userProfile?.displayName || 'Guest Mode'}>
                      {userProfile?.displayName || 'Guest Mode'}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 text-[9px] text-[#9b948a] border-t border-[#312e2b] pt-2 text-center">
                  Click status pill again to close
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="p-1.5 bg-[#312e2b] hover:bg-[#3d3a37] text-zinc-400 hover:text-white rounded transition"
            title={soundEnabled ? 'Volume Active' : 'Muted'}
            id="sound-toggle"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>

          {userProfile ? (
            <div className="flex items-center gap-2 bg-[#312e2b] px-2 py-0.5 rounded border border-[#3d3a37]">
              <div className="text-right">
                <div className="text-[10px] font-bold text-zinc-200 leading-tight">{userProfile.displayName}</div>
                <div className="text-[8px] text-emerald-400 font-mono font-semibold flex items-center justify-end gap-1 leading-none">
                  Elo {userProfile.rating}
                </div>
              </div>
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="w-5 h-5 rounded border border-zinc-700"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={handleAuthButton}
                className="p-0.5 text-zinc-500 hover:text-red-400 rounded transition"
                title="Sign Out"
                id="signout-btn"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : isFirebaseConfigured ? (
            <button
              onClick={handleAuthButton}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] py-1 px-3 rounded transition"
              id="google-login-btn"
            >
              <span>Join Arena</span>
            </button>
          ) : (
            <div className="text-[10px] text-zinc-400 font-mono bg-[#312e2b] px-2.5 py-0.5 rounded border border-[#3d3a37]">
              Guest Sandbox
            </div>
          )}
        </div>
      </nav>

      {/* Main Container Stage body */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-4 flex-1 w-full grid grid-cols-1">
        {firebaseSetupError && (
          <div className="mb-4 bg-amber-950/45 border-2 border-amber-500/30 rounded-lg p-5 flex flex-col md:flex-row items-start gap-4 text-zinc-350 shadow-lg animate-fadeIn">
            <div className="p-2.5 bg-amber-900/50 rounded-lg text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-3">
              <h4 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                ⚠️ Custom Firebase Configuration Action Needed
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your application loaded your custom Firebase details, but some cloud operations were blocked:
              </p>
              <div className="font-mono text-[11px] bg-[#12110f] p-3 rounded border border-zinc-800 text-amber-400 select-all overflow-x-auto max-w-full">
                {firebaseSetupError}
              </div>
              
              <div className="text-xs bg-[#1a1815]/60 p-4 rounded border border-amber-900/20 space-y-2.5 leading-relaxed">
                <p className="font-bold text-zinc-200">Please complete these three simple steps in your Firebase Console:</p>
                <ol className="list-decimal pl-4.5 space-y-2 text-zinc-400">
                  <li>
                    <strong className="text-zinc-200">Deploy Security Rules:</strong> Go to the file <code className="font-mono text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">firestore.rules</code> (at the root of this workspace), copy all its contents, and paste them into your <strong className="text-zinc-200">Firebase Console &gt; Firestore Database &gt; Rules tab</strong>, then click <strong className="text-zinc-200">Publish</strong>.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Enable Auth Providers:</strong> In your <strong className="text-zinc-200">Firebase Console &gt; Authentication &gt; Sign-in method</strong> tab, click <strong className="text-zinc-200">Add new provider</strong> and enable both <strong className="text-zinc-200">Google</strong> and <strong className="text-zinc-200">Anonymous</strong>, then save them.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Add Vercel to Authorized Domains:</strong> In your <strong className="text-zinc-200">Authentication &gt; Settings &gt; Authorized domains</strong> list, add your deployed Vercel domain (e.g. <code className="font-mono text-emerald-400">{window.location.hostname}</code>) so the pop-up authentication functions perfectly.
                  </li>
                </ol>
              </div>
            </div>
            <button 
              onClick={() => setFirebaseSetupError(null)} 
              className="text-xs font-semibold text-zinc-400 hover:text-white bg-[#312e2b] border border-zinc-700 md:self-auto px-3 py-1.5 rounded hover:bg-[#3d3a37] transition shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {!game ? (
          /* Landing options & matchmaking lists */
          <Lobby
            onStartComputerGame={handleStartComputerGame}
            onStartLocalGame={handleStartLocalGame}
            isFirebaseConnected={isFirebaseConfigured}
            onlineOpenGames={onlineOpenGames}
            onCreateOnlineGame={handleCreateOnlineRoom}
            onJoinOnlineGame={handleJoinOnlineRoom}
            onDeleteOnlineGame={handleDeleteOnlineGame}
            currentUserId={currentUser?.uid || ''}
            onStartPuzzle={handleStartPuzzle}
            onStartLesson={handleStartLesson}
            isLoggedIn={!!userProfile}
            onLogin={handleAuthButton}
          />
        ) : (
          /* Active Chess Match Interface layout - Responsive grids */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Frame: Board arena + players info cards (7 cols on large displays) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Top card description: Opponent profile */}
              <div className="bg-[#262421] border border-[#312e2b] rounded p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1b1a17] rounded text-zinc-400">
                    {game.isComputerGame ? <Bot className="w-4 h-4 text-emerald-400" /> : <User className="w-4 h-4 text-zinc-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-200">
                      {game.whitePlayerId === (currentUser?.uid || 'human')
                        ? game.blackPlayerName || 'Waiting for Opponent...'
                        : game.whitePlayerName || 'Waiting for Opponent...'}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Role: Opponent</div>
                  </div>
                </div>

                <span className="text-[9px] font-bold font-mono tracking-wider uppercase bg-[#1b1a17] border border-[#312e2b] text-zinc-400 px-2 py-0.5 rounded">
                  {game.whitePlayerId === (currentUser?.uid || 'human') ? 'Black Pieces' : 'White Pieces'}
                </span>
              </div>

              {/* Precise Chess board wrapper container */}
              <Chessboard
                fen={game.fen}
                onMove={applyMove}
                playerColor={game.blackPlayerId === currentUser?.uid ? 'b' : 'w'}
                editable={
                  game.status === 'playing' &&
                  (() => {
                    // Local Pass & Play Sandbox
                    if (game.gameId === 'local-pass-play' || game.whitePlayerId === 'human-white' || game.blackPlayerId === 'human-black') {
                      return true;
                    }
                    // Local Vs CPU Game, Puzzles, or Lessons
                    const isSingleplayer = game.isComputerGame || activePuzzle || activeLesson || game.gameId.startsWith('local-cpu');
                    if (isSingleplayer) {
                      return (game.turn === 'w' && game.whitePlayerId === 'human') || (game.turn === 'b' && game.blackPlayerId === 'human');
                    }
                    // Online Multiplayer Room Game
                    return (game.turn === 'w' && game.whitePlayerId === currentUser?.uid) || (game.turn === 'b' && game.blackPlayerId === currentUser?.uid);
                  })()
                }
                lastMove={
                  game.history.length > 0 ? { from: game.history[game.history.length - 1].from, to: game.history[game.history.length - 1].to } : null
                }
              />

              {/* Bottom card description: Current user profile */}
              <div className="bg-[#262421] border border-[#312e2b] rounded p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1b1a17] rounded text-zinc-400">
                    <User className="w-4 h-4 text-[#81b64c]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-200">
                      {game.whitePlayerId === (currentUser?.uid || 'human')
                        ? game.whitePlayerName || userProfile?.displayName || guestName
                        : game.blackPlayerName || userProfile?.displayName || guestName}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Role: Hero (You)</div>
                  </div>
                </div>

                <span className="text-[9px] font-bold font-mono tracking-wider uppercase bg-[#1b1a17] border border-green-950/40 text-green-500 px-2 py-0.5 rounded">
                  {game.whitePlayerId === (currentUser?.uid || 'human') ? 'White Pieces' : 'Black Pieces'}
                </span>
              </div>
            </div>

            {/* Right Frame: Match clocks, move log, analysis tray, live chat (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {activeLesson ? (
                /* Dedicated Chess Academy Sidebar HUD */
                <div className="bg-[#262421] border border-[#312e2b] rounded p-5 space-y-4 shadow-xl relative overflow-hidden" id="lesson-learning-panel">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full pointer-events-none" />
                  
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-[#312e2b] pb-3">
                    <span className="p-2.5 bg-emerald-950/45 text-emerald-400 rounded-lg">
                      <GraduationCap className="w-5 h-5 animate-pulse" />
                    </span>
                    <div>
                      <h2 className="text-sm font-extrabold text-zinc-100 uppercase tracking-tight">{activeLesson.title}</h2>
                      <p className="text-[10px] text-zinc-455 font-mono mt-0.5 text-emerald-400">
                        Lesson Progress Step ({lessonStepIndex}/{activeLesson.steps.length})
                      </p>
                    </div>
                  </div>

                  {/* Objective & Theme */}
                  <div className="bg-[#1b1a17]/90 rounded-lg p-3.5 border border-[#312e2b] text-xs space-y-2.5">
                    <p className="text-zinc-200 leading-relaxed font-sans">{activeLesson.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Target: {activeLesson.turn === 'w' ? 'White to Play' : 'Black to Play'}</span>
                    </div>
                  </div>

                  {/* Move Instructions / Dynamic Step Instruction */}
                  {lessonStatus === 'learning' && activeLesson.steps[lessonStepIndex] && (
                    <div className="bg-[#1b1a17]/40 border border-emerald-900/35 p-3 rounded text-zinc-300 text-xs leading-relaxed animate-fadeIn">
                      <strong className="text-emerald-400 font-bold block mb-1 font-sans">Active Instruction:</strong>
                      {activeLesson.steps[lessonStepIndex].explanation ? "Locate the perfect move to execute the goal." : "Assess details carefully."}
                    </div>
                  )}

                  {/* Solving Feedback Card */}
                  {lessonStatus === 'learning' && (
                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-[#81b64c] animate-pulse font-sans">
                      <HelpCircle className="w-4 h-4 shrink-0 text-[#81b64c]" />
                      <div>
                        <strong className="font-bold text-zinc-100 block">Your Turn to Move!</strong>
                        Drag or click on the board to execute this concept.
                      </div>
                    </div>
                  )}

                  {lessonStatus === 'completed' && (
                    <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-emerald-300 transition-all font-sans">
                      <Award className="w-4 h-4 shrink-0 text-emerald-400" />
                      <div>
                        <strong className="font-extrabold text-emerald-200 block text-sm">Lesson Mastered! 🏆</strong>
                        <p className="mt-1 text-emerald-300/90 leading-relaxed">
                          {activeLesson.steps[activeLesson.steps.length - 1].explanation}
                        </p>
                        <span className="inline-block mt-2 font-mono text-[9px] bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded uppercase font-bold animate-pulse">
                          Tactics +10 mastery
                        </span>
                      </div>
                    </div>
                  )}

                  {lessonStatus === 'failed' && (
                    <div className="bg-red-955/25 border border-red-900/40 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-red-350 font-sans">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <div>
                        <strong className="font-bold text-red-200 block">Incorrect Maneuver!</strong>
                        That move doesn't align with this masterclass concept. Reset the board to try again.
                      </div>
                    </div>
                  )}

                  {/* Hints Trigger */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowLessonClue(c => !c)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer ml-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      {showLessonClue ? 'Hide Hint' : 'Need Academy Tip?'}
                    </button>
                    {showLessonClue && (
                      <div className="p-3 bg-zinc-900/60 border border-[#312e2b] rounded text-emerald-300/90 text-[11px] font-medium leading-relaxed italic animate-slideDown">
                        💡 Tutor Tip: {activeLesson.clue}
                      </div>
                    )}
                  </div>

                  {/* Mini actions inside panel */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={handleResetLesson}
                      className="bg-[#312e2b] hover:bg-[#3d3a37] text-zinc-205 border border-[#44403c] font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                      id="lesson-action-reset"
                    >
                      Reset Lesson
                    </button>
                    
                    <button
                      onClick={handleNextLesson}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                      id="lesson-action-next"
                    >
                      Next Lesson
                    </button>
                  </div>

                  <button
                    onClick={handleExitToLobby}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-[#312e2b] py-2.5 rounded text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    id="lesson-action-to-lobby"
                  >
                    Return to Academy Curriculum
                  </button>
                </div>
              ) : activePuzzle ? (
                /* Dedicated Chess Puzzle Sidebar HUD */
                <div className="bg-[#262421] border border-[#312e2b] rounded p-5 space-y-4 shadow-xl relative overflow-hidden" id="puzzle-solving-panel">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-full pointer-events-none" />
                  
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-[#312e2b] pb-3">
                    <span className="p-2.5 bg-yellow-950/45 text-yellow-500 rounded-lg">
                      <Trophy className="w-5 h-5 animate-pulse" />
                    </span>
                    <div>
                      <h2 className="text-sm font-extrabold text-zinc-100 uppercase tracking-tight">{activePuzzle.title}</h2>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5 animate-pulse">
                        Tactical Progress ({puzzleMoveIndex}/{activePuzzle.solutionMoves.length})
                      </p>
                    </div>
                  </div>

                  {/* Objective & Theme */}
                  <div className="bg-[#1b1a17]/90 rounded-lg p-3.5 border border-[#312e2b] text-xs space-y-2.5">
                    <p className="text-zinc-200 leading-relaxed font-sans">{activePuzzle.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                      <span>Target: {activePuzzle.turn === 'w' ? 'White to Play and Win' : 'Black to Play and Win'}</span>
                    </div>
                  </div>

                  {/* Solving Feedback Card */}
                  {puzzleStatus === 'solving' && (
                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-[#81b64c] animate-pulse font-sans">
                      <HelpCircle className="w-4 h-4 shrink-0 text-[#81b64c]" />
                      <div>
                        <strong className="font-bold text-zinc-100 block">Your Move Turn!</strong>
                        Calculate the optimal combination and slide the piece to start.
                      </div>
                    </div>
                  )}

                  {puzzleStatus === 'solved' && (
                    <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-emerald-300 animate-fadeIn font-sans">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <div>
                        <strong className="font-extrabold text-emerald-200 block text-sm">Puzzle Solved! 🎉</strong>
                        <p className="mt-0.5 text-emerald-300/90 leading-relaxed">
                          Splendid calculation! You navigated the critical tactical progression flawlessly. Elo rating elevated.
                        </p>
                      </div>
                    </div>
                  )}

                  {puzzleStatus === 'failed' && (
                    <div className="bg-red-950/25 border border-red-900/40 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-red-350 font-sans">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <div>
                        <strong className="font-bold text-red-200 block">Incorrect Move!</strong>
                        That combination is not correct. Reset the board and try a different route.
                      </div>
                    </div>
                  )}

                  {/* Hints Trigger */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowPuzzleClue(c => !c)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer ml-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-yellow-500" />
                      {showPuzzleClue ? 'Hide Clue' : 'Need a Clue / Hint?'}
                    </button>
                    {showPuzzleClue && (
                      <div className="p-3 bg-zinc-900/60 border border-[#312e2b] rounded text-zinc-300 text-[11px] font-medium leading-relaxed italic animate-slideDown">
                        💡 Hint: {activePuzzle.clue}
                      </div>
                    )}
                  </div>

                  {/* Mini actions inside panel */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={handleResetPuzzle}
                      className="bg-[#312e2b] hover:bg-[#3d3a37] text-zinc-205 border border-[#44403c] font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                      id="puzzle-action-reset"
                    >
                      Reset Position
                    </button>
                    
                    <button
                      onClick={handleNextPuzzle}
                      className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                      id="puzzle-action-next"
                    >
                      Next Puzzle
                    </button>
                  </div>

                  <button
                    onClick={handleExitToLobby}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-[#312e2b] py-2.5 rounded text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    id="puzzle-action-to-lobby"
                  >
                    Go Back to Lobby
                  </button>
                </div>
              ) : (
                /* Regular Match Sidebars */
                <>
                  {/* Clocks container widget */}
                  <GameClock
                    turn={game.turn}
                    status={game.status}
                    whiteTimeRemaining={game.whiteTimeRemaining}
                    blackTimeRemaining={game.blackTimeRemaining}
                    lastMoveTimestamp={game.lastMoveTimestamp}
                    isUnlimited={game.timeControl === 'untimed'}
                    onTimeout={handleClockTimeout}
                  />

                  {/* Action buttons list */}
                  {game.status === 'playing' && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleResign}
                        className="bg-red-950/20 hover:bg-red-950/30 text-red-400 font-bold font-sans text-xs py-1.5 px-3 border border-red-900/30 rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                        id="action-resign"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Resign
                      </button>

                      {game.gameId === 'local-pass-play' ? (
                        <button
                          onClick={handleStartLocalGame}
                          className="bg-zinc-800/80 hover:bg-zinc-700 text-[#81b64c] font-bold font-sans text-xs py-1.5 px-3 border border-zinc-700/60 rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                          id="action-reset"
                          title="Reset current match"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reset
                        </button>
                      ) : (
                        !game.isComputerGame && (
                          <>
                            {game.drawOfferedBy && game.drawOfferedBy !== currentUser?.uid ? (
                              <button
                                onClick={handleAcceptDraw}
                                className="bg-amber-950/25 hover:bg-amber-950/40 text-amber-300 font-bold font-sans text-xs py-1.5 px-3 border border-amber-900/40 rounded flex items-center justify-center gap-1.5 transition animate-pulse cursor-pointer"
                                id="action-accept-draw"
                              >
                                <Handshake className="w-3.5 h-3.5" />
                                Accept Draw
                              </button>
                            ) : (
                              <button
                                onClick={handleOfferDraw}
                                className="bg-[#262421] hover:bg-[#312e2b] text-zinc-300 font-bold font-sans text-xs py-1.5 px-3 border border-[#312e2b] rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                                id="action-offer-draw"
                                disabled={!!game.drawOfferedBy}
                              >
                                <Handshake className="w-3.5 h-3.5" />
                                {game.drawOfferedBy ? 'Draw Offered' : 'Offer Draw'}
                              </button>
                            )}
                          </>
                        )
                      )}

                      <button
                        onClick={handleExitToLobby}
                        className="bg-[#262421] hover:bg-[#312e2b] text-zinc-300 font-bold font-sans text-xs py-1.5 px-3 border border-[#312e2b] rounded flex items-center justify-center gap-1.5 col-span-1 transition cursor-pointer"
                        id="action-exit-lobby"
                      >
                        <Home className="w-3.5 h-3.5" />
                        Lobby
                      </button>
                    </div>
                  )}

                  {/* Hosting waiting/matching status card */}
                  {game.status === 'waiting' && (
                    <div className="bg-[#262421] border border-amber-500/20 rounded p-5 text-center space-y-4 shadow-lg animate-fadeIn text-zinc-100">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="relative">
                          {/* Pulsing ring indicator */}
                          <span className="absolute -inset-1 rounded-full bg-amber-500/10 animate-ping" />
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Hosting Match Hall</h3>
                        {game.isPrivate ? (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>🔒 Private Game</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-550/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>🌐 Public Lobby Match</span>
                          </span>
                        )}
                      </div>

                      {/* Displaying Room Code elegantly with Copy functionality */}
                      <div className="bg-[#1b1a17] p-4 rounded border border-amber-500/20 text-center space-y-2">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Your Invite Room Code:</span>
                        <div className="font-mono text-2xl font-black text-amber-400 tracking-widest bg-[#21201d] py-2 px-4 rounded border border-[#312e2b] flex items-center justify-center gap-2 select-all relative group">
                          <span>{game.gameId}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(game.gameId);
                            }}
                            className="text-amber-500 hover:text-amber-400 p-1 rounded hover:bg-[#312e2b] transition cursor-pointer"
                            title="Copy Code"
                            id="copy-room-code-btn"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 italic">Share this code with your opponent or friend to play together!</p>
                      </div>
                      
                      <div className="bg-[#1b1a17]/60 p-3 rounded border border-[#312e2b] text-left text-xs space-y-2 text-zinc-400">
                        <div className="flex justify-between">
                          <span>Match Format:</span>
                          <span className="font-mono text-zinc-200 capitalize font-medium">{game.timeControl === 'untimed' ? 'Untimed' : game.timeControl}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Your Pieces:</span>
                          <span className="font-mono text-zinc-200 font-medium">{game.whitePlayerId === currentUser?.uid ? 'White pieces' : 'Black pieces'}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                        Waiting for a challenger to enter your room code or accept your chess game listing from the public Matchmaking lobby...
                      </p>

                      <button
                        onClick={handleCancelHostedMatch}
                        className="w-full bg-red-950/35 hover:bg-red-900/40 text-red-400 border border-red-900/50 hover:text-red-350 font-bold py-2.5 rounded text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                        id="action-cancel-hosted"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Cancel Hosted Match
                      </button>
                    </div>
                  )}

                  {/* Game ending action button back to main lobby */}
                  {game.status !== 'playing' && game.status !== 'waiting' && (
                    <div className="flex flex-col gap-2 w-full">
                      {game.gameId === 'local-pass-play' && (
                        <button
                          onClick={handleStartLocalGame}
                          className="w-full bg-[#81b64c] hover:bg-[#91c55c] text-white font-bold py-2.5 rounded text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                          id="action-reset-ended"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Rematch / Play Again
                        </button>
                      )}
                      <button
                        onClick={handleExitToLobby}
                        className={`w-full font-bold py-2.5 rounded text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer ${
                          game.gameId === 'local-pass-play'
                            ? 'bg-[#312e2b] hover:bg-[#3d3a37] text-zinc-300 border border-[#3e3a34]'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                        }`}
                        id="action-return-lobby"
                      >
                        Return to Lobby Matching
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Positional Grandmaster AI Coach Analysis */}
                  <div className="bg-[#262421] border border-[#312e2b] rounded p-4 space-y-3.5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#81b64c]/5 to-transparent rounded-full pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-[#312e2b] text-[#81b64c] rounded">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <h4 className="font-sans font-bold text-xs text-zinc-200">Gemini Grandmaster Coach</h4>
                          <p className="text-[9px] text-zinc-500 font-mono">Move analysis & tactical review</p>
                        </div>
                      </div>

                      <button
                        onClick={triggerCoachReview}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 text-xs text-green-400 hover:text-white bg-[#312e2b] hover:bg-[#3d3a37] border border-[#44403c] font-bold font-sans py-1 px-2 rounded.5 transition disabled:opacity-50 cursor-pointer"
                        id="coach-review-btn"
                      >
                        {isAnalyzing ? 'Thinking...' : 'Coach Review'}
                      </button>
                    </div>

                    {isAnalyzing && (
                      <div className="flex items-center justify-center gap-2 py-4 text-center text-[11px] text-zinc-400 font-sans">
                        <div className="w-3.5 h-3.5 border-2 border-[#81b64c]/20 border-t-[#81b64c] rounded-full animate-spin" />
                        <span>Calculating deep pawn and piece coordinate strategies...</span>
                      </div>
                    )}

                    {coachAnalysis && (
                      <div className="bg-[#1b1a17]/85 rounded p-3 border border-[#312e2b] space-y-2 animate-fadeIn text-xs font-sans leading-relaxed">
                        <div className="flex items-center justify-between border-b border-[#312e2b] pb-1.5">
                          <span className="font-sans font-extrabold text-zinc-400">Position Evaluation:</span>
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                            {coachAnalysis.evaluation}
                          </span>
                        </div>

                        <div className="text-zinc-350">
                          <span className="font-bold text-[#81b64c]">Coach feedback: </span>
                          {coachAnalysis.commentary}
                        </div>

                        <div className="bg-[#262421] p-2 rounded border border-[#312e2b] flex items-center justify-between gap-4 mt-1">
                          <span className="font-bold text-zinc-400 text-[10px]">Recommended Play:</span>
                          <span className="font-mono font-bold text-[#81b64c] text-[10px]">
                            {coachAnalysis.bestMove}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Move History Column */}
                  <MoveHistory history={game.history} status={game.status} winner={game.winner} />

                  {/* Live Chat Frame (Only shown for real-time online games) */}
                  {!game.isComputerGame && (
                    <div className="bg-[#262421] border border-[#312e2b] rounded overflow-hidden shadow-lg flex flex-col h-[220px]">
                      <div className="bg-[#1b1a17] px-4 py-2 border-b border-[#312e2b] flex items-center gap-1.5 text-zinc-300 font-sans font-bold text-xs">
                        <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                        <span>Game Chat</span>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin max-h-[130px]">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-[11px] text-zinc-500 py-4 h-full flex items-center justify-center">
                            Room chat is empty. Exchange friendly tactics or handshakes !
                          </div>
                        ) : (
                          chatMessages.map(msg => {
                            const isSelf = msg.senderId === currentUser?.uid;
                            return (
                              <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                                <div className="text-[9px] text-zinc-500 font-sans font-semibold mb-0.5">
                                  {msg.senderName}
                                </div>
                                <div
                                  className={`rounded px-2.5 py-1.5 text-xs max-w-[85%] font-sans break-all ${
                                    isSelf ? 'bg-green-600 text-white' : 'bg-[#1b1a17] text-zinc-200 border border-[#312e2b]'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <form
                        onSubmit={handleSendChatMessage}
                        className="p-1.5 bg-[#1b1a17] border-t border-[#312e2b] flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          className="bg-transparent border-none text-xs text-white focus:outline-none w-full p-2 placeholder-zinc-650"
                          placeholder="Type your strategy message..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value.substring(0, 100))}
                          maxLength={100}
                          id="input-chat-msg"
                        />
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-500 text-white p-2 rounded cursor-pointer flex items-center justify-center shrink-0"
                          title="Send message"
                          id="send-chat-msg-btn"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
