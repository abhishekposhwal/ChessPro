import { useState } from 'react';
import { Play, User, Users, Cpu, ShieldAlert, Wifi, Layers, Trophy, BookOpen, Sparkles, Trash2 } from 'lucide-react';
import { TimeControl } from '../types';
import { CHESS_PUZZLES } from '../data/puzzles';
import { CHESS_LESSONS, Lesson } from '../data/lessons';

interface LobbyProps {
  onStartComputerGame: (difficulty: number, color: 'w' | 'b' | 'random') => void;
  onStartLocalGame: () => void;
  isFirebaseConnected: boolean;
  onlineOpenGames: any[];
  onCreateOnlineGame: (timeControl: TimeControl, preferredColor: 'w' | 'b' | 'random', playerName: string, isPrivate: boolean) => void;
  onJoinOnlineGame: (gameId: string, playerName: string) => void;
  onDeleteOnlineGame?: (gameId: string) => void;
  currentUserId?: string;
  onStartPuzzle?: (puzzle?: any) => void;
  onStartLesson?: (lesson?: Lesson) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
}

export default function Lobby({
  onStartComputerGame,
  onStartLocalGame,
  isFirebaseConnected,
  onlineOpenGames,
  onCreateOnlineGame,
  onJoinOnlineGame,
  onDeleteOnlineGame,
  currentUserId,
  onStartPuzzle,
  onStartLesson,
  isLoggedIn,
  onLogin,
}: LobbyProps) {
  const [selectedSubTab, setSelectedSubTab] = useState<'computer' | 'local' | 'online' | 'puzzles' | 'learn'>('computer');

  // Multi-option state for setting up Computer game
  const [cpuDifficulty, setCpuDifficulty] = useState<number>(3);
  const [cpuColor, setCpuColor] = useState<'w' | 'b' | 'random'>('w');

  // Multi-option state for setting up Online game
  const [onlineTimeControl, setOnlineTimeControl] = useState<TimeControl>('10m');
  const [onlinePrefColor, setOnlinePrefColor] = useState<'w' | 'b' | 'random'>('random');
  const [playerName, setPlayerName] = useState<string>(() => {
    const saved = localStorage.getItem('chess_player_name');
    if (saved) return saved;
    const randId = Math.floor(1000 + Math.random() * 9000);
    return `Player${randId}`;
  });
  const [isPrivateGame, setIsPrivateGame] = useState<boolean>(false);

  // Room code join states
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [joinError, setJoinError] = useState<string>('');

  const handleJoinByCode = () => {
    const trimmedCode = roomCodeInput.trim().toUpperCase();
    if (trimmedCode.length !== 6) {
      setJoinError('Please enter a valid 6-character code.');
      return;
    }
    setJoinError('');
    localStorage.setItem('chess_player_name', playerName.trim());
    onJoinOnlineGame(trimmedCode, playerName.trim() || 'Guest Challenger');
  };

  const handleCreateOnline = () => {
    localStorage.setItem('chess_player_name', playerName.trim());
    onCreateOnlineGame(onlineTimeControl, onlinePrefColor, playerName.trim() || 'Grandmaster', isPrivateGame);
  };

  const handleJoinOnline = (gameId: string) => {
    localStorage.setItem('chess_player_name', playerName.trim());
    onJoinOnlineGame(gameId, playerName.trim() || 'Guest Challenger');
  };

  const difficulties = [
    { level: 1, name: 'Beginner (Pawn)', desc: 'Focuses on basic captures & trades.' },
    { level: 2, name: 'Casual (Knight)', desc: 'Defends major pieces and castles early.' },
    { level: 3, name: 'Expert (Rook)', desc: 'Fiercer tactics, controls open lines.' },
    { level: 4, name: 'Master (Queen)', desc: 'Deep coordination, strategic maneuvers.' },
    { level: 5, name: 'Grandmaster (Gemini AI)', desc: 'Advanced engine calculations.' },
  ];

  return (
    <div className="w-full max-w-xl mx-auto bg-[#262421] border border-[#312e2b] rounded-md shadow-2xl overflow-hidden font-sans">
      {/* Banner design */}
      <div className="bg-[#21201d] px-6 py-6 text-center border-b border-[#312e2b] relative">
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center font-bold text-white text-xs">C</div>
          <span>CHESS</span>
        </h2>
        <p className="text-gray-400 text-xs mt-1 font-medium tracking-wide">
          Real-time Matchmaking, Gemini grandmaster feedback, and Pass & Play Chess
        </p>
      </div>

      {/* Main Tab Switches */}
      <div className="flex bg-[#1b1a17] border-b border-[#312e2b] p-1 gap-1">
        <button
          onClick={() => setSelectedSubTab('computer')}
          className={`flex-1 py-2 px-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            selectedSubTab === 'computer'
              ? 'bg-[#312e2b] text-white border border-[#44403c]'
              : 'text-gray-400 hover:text-white hover:bg-[#21201d]'
          }`}
          id="tab-vs-computer"
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          Play Computer
        </button>

        <button
          onClick={() => setSelectedSubTab('local')}
          className={`flex-1 py-2 px-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            selectedSubTab === 'local'
              ? 'bg-[#312e2b] text-white border border-[#44403c]'
              : 'text-gray-400 hover:text-white hover:bg-[#21201d]'
          }`}
          id="tab-vs-local"
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          Pass & Play
        </button>

        <button
          onClick={() => setSelectedSubTab('online')}
          className={`flex-1 py-1 px-1 sm:py-2 sm:px-2 rounded text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedSubTab === 'online'
              ? 'bg-[#312e2b] text-white border border-[#44403c]'
              : 'text-gray-400 hover:text-white hover:bg-[#21201d]'
          }`}
          id="tab-vs-online"
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          Online Arena
        </button>

        <button
          onClick={() => setSelectedSubTab('puzzles')}
          className={`flex-1 py-1 px-1 sm:py-2 sm:px-2 rounded text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedSubTab === 'puzzles'
              ? 'bg-[#312e2b] text-white border border-[#44403c]'
              : 'text-gray-400 hover:text-white hover:bg-[#21201d]'
          }`}
          id="tab-vs-puzzles"
        >
          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
          Puzzles
        </button>

        <button
          onClick={() => setSelectedSubTab('learn')}
          className={`flex-1 py-1 px-1 sm:py-2 sm:px-2 rounded text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedSubTab === 'learn'
              ? 'bg-[#312e2b] text-white border border-[#44403c]'
              : 'text-gray-400 hover:text-white hover:bg-[#21201d]'
          }`}
          id="tab-vs-learn"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          Learn
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6 space-y-6">
        {selectedSubTab === 'computer' && (
          <div className="space-y-6" id="panel-computer">
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2.5">
                Target AI Level: {cpuDifficulty} / 5
              </label>
              <div className="space-y-2">
                {difficulties.map(diff => (
                  <button
                    key={diff.level}
                    onClick={() => setCpuDifficulty(diff.level)}
                    className={`w-full text-left p-2.5 rounded border transition flex items-start gap-3 cursor-pointer ${
                      cpuDifficulty === diff.level
                        ? "bg-[#312e2b] border-green-600 text-white shadow-sm"
                        : "bg-[#1b1a17]/45 border-[#312e2b] hover:bg-[#21201d] text-zinc-300"
                    }`}
                    id={`diff-choice-${diff.level}`}
                  >
                    <span
                      className={`font-mono text-xs font-bold rounded w-5 h-5 flex items-center justify-center ${
                        cpuDifficulty === diff.level ? "bg-green-600 text-white" : "bg-[#312e2b] text-zinc-400"
                      }`}
                    >
                      {diff.level}
                    </span>
                    <div>
                      <div className="text-xs font-bold font-sans flex items-center gap-1.5">
                        {diff.name}
                        {diff.level === 5 && (
                          <span className="text-[9px] bg-indigo-500/25 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase animate-pulse">
                            Gemini High IQ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{diff.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2.5">
                Play As Side:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'w', name: 'White Pieces' },
                  { id: 'b', name: 'Black Pieces' },
                  { id: 'random', name: 'Random Selection' },
                ].map(side => (
                  <button
                    key={side.id}
                    onClick={() => setCpuColor(side.id as any)}
                    className={`group p-2 rounded border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      cpuColor === side.id
                        ? "bg-[#312e2b] border-[#44403c] text-white"
                        : "bg-[#1b1a17]/50 border-[#312e2b] hover:bg-[#21201d] text-zinc-400"
                    }`}
                    id={`side-choice-${side.id}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full transition-transform duration-200 group-hover:scale-110 ${
                        side.id === 'w' ? 'bg-white' : side.id === 'b' ? 'bg-zinc-800' : ''
                      }`}
                      style={side.id === 'random' ? { background: 'linear-gradient(90deg, #ffffff 50%, #27272a 50%)' } : undefined}
                    />
                    <span>{side.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onStartComputerGame(cpuDifficulty, cpuColor)}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 shadow transition cursor-pointer"
              id="start-computer-btn"
            >
              <Play className="w-4 h-4 fill-current" />
              Battle Computer Opponent
            </button>
          </div>
        )}

        {selectedSubTab === 'local' && (
          <div className="text-center py-6 space-y-6" id="panel-local">
            <div className="bg-[#1b1a17]/50 p-6 rounded border border-[#312e2b] flex flex-col items-center justify-center">
              <span className="p-3.5 bg-green-950/40 text-green-500 rounded mb-3">
                <Layers className="w-8 h-8" />
              </span>
              <h3 className="text-base font-bold text-white">Classic Local Game</h3>
              <p className="text-zinc-400 text-xs mt-2 max-w-sm">
                Pass & Play mode runs entirely off-grid. Use this with a friend sitting next to you to take turns shifting the device. No internet required!
              </p>
            </div>

            <button
              onClick={onStartLocalGame}
              className="w-full bg-gray-200 hover:bg-white text-black font-bold py-3 rounded text-sm flex items-center justify-center gap-2 shadow transition cursor-pointer"
              id="start-local-btn"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Pass & Play Chess
            </button>
          </div>
        )}

        {selectedSubTab === 'online' && (
          <div className="space-y-6" id="panel-online">
            {/* Show setup status message */}
            {!isFirebaseConnected ? (
              <div className="bg-[#1b1a17]/50 border border-amber-900/30 p-5 rounded flex flex-col items-center text-center space-y-2.5">
                <ShieldAlert className="w-8 h-8 text-amber-500" />
                <h4 className="text-xs font-bold text-amber-200">Firebase Setup Connection Required</h4>
                <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                  To open live multiplayer matchmaking collections, authorize the Firebase service first. Accept terms in the setup UI, and matchmaking triggers instantly!
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-[#21201d] py-1 px-2.5 rounded border border-[#312e2b]">
                  <Wifi className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Currently Operating in Solo Sandbox Mode</span>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Input player representation alias */}
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Your Player Alias:
                  </label>
                  <div className="flex items-center bg-[#1b1a17] rounded p-2 border border-[#312e2b]">
                    <User className="w-4 h-4 text-zinc-500 mx-2" />
                    <input
                      type="text"
                      className="bg-transparent border-none text-white text-xs w-full focus:outline-none placeholder-zinc-650"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value.substring(0, 18))}
                      placeholder="e.g. GarryKasparov"
                      maxLength={18}
                      id="input-player-name"
                    />
                  </div>
                </div>

                {/* Create a game widget options */}
                <div className="bg-[#1b1a17]/50 p-4 rounded border border-[#312e2b] space-y-3.5">
                  <span className="text-[#81b64c] text-xs font-bold uppercase tracking-wide block">
                    Host New Online Match
                  </span>

                  {!isLoggedIn ? (
                    <div className="text-center py-2 space-y-3">
                      <p className="text-zinc-400 text-xs leading-relaxed">
                        Please sign in with a registered account to host live chess matches in the Online Arena.
                      </p>
                      <button
                        onClick={onLogin}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                        id="create-online-game-btn"
                      >
                        Sign In to Host Live Game
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-zinc-500 text-[10px] font-bold uppercase mb-1">
                            Time Limit:
                          </label>
                          <select
                            value={onlineTimeControl}
                            onChange={e => setOnlineTimeControl(e.target.value as TimeControl)}
                            className="bg-[#21201d] border border-[#312e2b] text-white text-xs p-2 rounded w-full focus:outline-none"
                            id="select-time-control"
                          >
                            <option value="1m">1 Min (Bullet)</option>
                            <option value="3m">3 Min (Blitz)</option>
                            <option value="5m">5 Min (Blitz)</option>
                            <option value="10m">10 Min (Rapid)</option>
                            <option value="30m">30 Min (Classical)</option>
                            <option value="untimed">Unlimited (Untimed)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-zinc-500 text-[10px] font-bold uppercase mb-1">
                            Prefer Color:
                          </label>
                          <select
                            value={onlinePrefColor}
                            onChange={e => setOnlinePrefColor(e.target.value as any)}
                            className="bg-[#21201d] border border-[#312e2b] text-white text-xs p-2 rounded w-full focus:outline-none"
                            id="select-pref-color"
                          >
                            <option value="random">Random Selection</option>
                            <option value="w">White Pieces</option>
                            <option value="b">Black Pieces</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-500 text-[10px] font-bold uppercase mb-1">
                          Game Visibility:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIsPrivateGame(false)}
                            className={`py-2 px-3 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                              !isPrivateGame
                                ? 'bg-green-600/10 border-green-500 text-green-400'
                                : 'bg-[#21201d] border-[#312e2b] text-zinc-400 hover:text-white'
                            }`}
                            id="visibility-public-btn"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Public Lobby
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsPrivateGame(true)}
                            className={`py-2 px-3 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                              isPrivateGame
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                : 'bg-[#21201d] border-[#312e2b] text-zinc-400 hover:text-white'
                            }`}
                            id="visibility-private-btn"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Private Link
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleCreateOnline}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                        id="create-online-game-btn"
                      >
                        {isPrivateGame ? 'Host Private Game (Code)' : 'Host Public Match Request'}
                      </button>
                    </>
                  )}
                </div>

                {/* Join with Room Code widget */}
                <div className="bg-[#1b1a17]/50 p-4 rounded border border-[#312e2b] space-y-3.5">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-wide block">
                    Join Private Match by Code
                  </span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-[#21201d] border border-[#312e2b] text-white text-xs p-2.5 rounded focus:outline-none placeholder-zinc-500 font-mono uppercase tracking-widest text-center font-black text-amber-400"
                      value={roomCodeInput}
                      onChange={e => {
                        setRoomCodeInput(e.target.value.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, ''));
                        setJoinError('');
                      }}
                      placeholder="ENTER CODE"
                      maxLength={6}
                      id="input-room-code"
                    />
                    <button
                      onClick={handleJoinByCode}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded text-xs transition cursor-pointer shadow-md inline-flex items-center justify-center"
                      id="join-private-btn"
                    >
                      Join Game
                    </button>
                  </div>
                  {joinError && (
                    <div className="text-[10px] text-red-400 font-bold tracking-wide">{joinError}</div>
                  )}
                </div>

                {/* Open matching rooms list */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#312e2b] pb-2">
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      Public Lobby Rooms ({onlineOpenGames.length})
                    </span>
                    <span className="text-[10px] flex items-center gap-1.5 text-green-500 bg-green-950/20 px-2 py-0.5 rounded font-semibold animate-pulse border border-green-900/30">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Live Feed
                    </span>
                  </div>

                  {onlineOpenGames.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 border border-dashed border-[#312e2b] rounded bg-[#1b1a17]/20 text-xs">
                      No active Chess rooms waiting. Create one above to invite competitors!
                    </div>
                  ) : (
                    <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
                      {onlineOpenGames.map(g => {
                        let selfHostedList: string[] = [];
                        try {
                          selfHostedList = JSON.parse(localStorage.getItem('hosted_game_ids') || '[]');
                        } catch {
                          selfHostedList = [];
                        }
                        const isHost = (currentUserId && (g.whitePlayerId === currentUserId || g.blackPlayerId === currentUserId)) || selfHostedList.includes(g.gameId);
                        return (
                          <div
                            key={g.gameId}
                            className="bg-[#1b1a17] border border-[#312e2b] hover:bg-[#2d2b28] rounded p-2.5 flex items-center justify-between gap-4 transition"
                            id={`lobby-game-${g.gameId}`}
                          >
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>By: {g.whitePlayerName || g.blackPlayerName || 'Anonymous Master'}</span>
                                {isHost && (
                                  <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded font-mono uppercase tracking-wide">
                                    Your Game
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 flex items-center gap-3 mt-0.5">
                                <span>Speed: <strong className="text-zinc-300 font-mono">{g.timeControl.toUpperCase()}</strong></span>
                                <span>•</span>
                                <span>Role:{' '}
                                  <strong className="text-zinc-300">
                                    {g.whitePlayerId ? 'White Pieces Filled' : 'Black Pieces Filled'}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isHost && onDeleteOnlineGame && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteOnlineGame(g.gameId);
                                  }}
                                  className="bg-red-950/45 hover:bg-red-900/50 text-red-500 p-1.5 rounded transition cursor-pointer border border-red-905/40"
                                  title="Delete your hosted match request"
                                  id={`delete-game-btn-${g.gameId}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleJoinOnline(g.gameId)}
                                className="bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold py-1.5 px-3 rounded transition cursor-pointer"
                                id={`join-game-btn-${g.gameId}`}
                              >
                                {isHost ? 'View' : 'Fight'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Multi-Tab Testing Tip Box */}
                  <div className="mt-3.5 p-3.5 bg-[#1b1a17]/55 border border-[#312e2b] rounded-md text-xs text-zinc-400 space-y-1.5">
                    <p className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse animate-duration-1000" />
                      Testing Matchmaking / Real-time play?
                    </p>
                    <p className="leading-relaxed text-[11px]">
                      If you open two tabs in the same browser, they share the same Firebase authentication identity and won't be registered as separate players. 
                      To test real-time multiplayer, <strong>open the second player in an Incognito / Private window or a completely different browser</strong>. This creates a separate player session with a distinct player ID!
                    </p>
                  </div>


                </div>
              </div>
            )}
          </div>
        )}

        {selectedSubTab === 'puzzles' && (
          <div className="space-y-6" id="panel-puzzles">
            <div className="bg-[#1b1a17]/50 p-6 rounded border border-[#312e2b] flex flex-col items-center justify-center text-center">
              <span className="p-3.5 bg-yellow-950/45 text-yellow-500 rounded mb-3">
                <Trophy className="w-8 h-8 animate-pulse" />
              </span>
              <h3 className="text-base font-bold text-white">Tactical Chess Puzzles</h3>
              <p className="text-zinc-400 text-xs mt-2 max-w-sm leading-relaxed">
                Train your pattern recognition with legendary setups! Find the correct sequence of moves to execute crushing mating patterns, underpromotions, and forks.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">
                Select a Tactical Puzzle:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHESS_PUZZLES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onStartPuzzle?.(p)}
                    className="p-3 bg-[#1b1a17] hover:bg-[#201f1c] border border-[#312e2b] hover:border-yellow-600/50 rounded text-left transition flex items-center justify-between group cursor-pointer"
                    id={`start-puzzle-${p.id}`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-zinc-200 group-hover:text-yellow-400 transition">{p.title}</div>
                      <div className="text-[10px] text-zinc-500">{p.turn === 'w' ? 'White to Play' : 'Black to Play'}</div>
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-[#262421] text-zinc-400 group-hover:bg-yellow-950 group-hover:text-yellow-400 transition">
                      Play
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onStartPuzzle?.()}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-3 rounded text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              id="start-random-puzzle-btn"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              Play Random Puzzle Challenge
            </button>
          </div>
        )}

        {selectedSubTab === 'learn' && (
          <div className="space-y-6" id="panel-learn">
            <div className="bg-gradient-to-r from-emerald-950/20 to-teal-950/20 p-6 rounded-lg border border-emerald-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full pointer-events-none" />
              <div className="flex items-center gap-3.5 mb-3">
                <span className="p-3 bg-emerald-950/50 text-emerald-400 rounded">
                  <BookOpen className="w-8 h-8" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Chess Academy</h3>
                  <p className="text-[11px] text-emerald-400/90 font-mono">Master rules & tactical motifs</p>
                </div>
              </div>
              <p className="text-zinc-400 text-xs max-w-lg leading-relaxed">
                Step-by-step interactive lessons to build deep positional chess knowledge. Play through the setups and earn mastery points!
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">
                Interactive Lesson Curriculum:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CHESS_LESSONS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => onStartLesson?.(l)}
                    className="p-4 bg-[#1b1a17] hover:bg-[#201f1c] border border-[#312e2b] hover:border-emerald-500/50 rounded-lg text-left transition flex flex-col justify-between h-40 group cursor-pointer"
                    id={`start-lesson-${l.id}`}
                  >
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-zinc-900 text-emerald-400">
                          {l.category}
                        </span>
                        <span className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded ${
                          l.difficulty === 'Beginner' ? 'bg-green-950/50 text-green-400' :
                          l.difficulty === 'Intermediate' ? 'bg-amber-955/50 text-amber-500' :
                          'bg-red-955/50 text-red-400'
                        }`}>
                          {l.difficulty}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition">
                        {l.title}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {l.description}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-end pt-2 border-t border-[#312e2b]/55 text-xs text-zinc-500 group-hover:text-emerald-400 font-bold transition">
                      <span>Begin Training &rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
