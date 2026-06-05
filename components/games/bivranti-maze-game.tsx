'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Lightbulb, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/audio-utils';

// ── Types ──────────────────────────────────────────────────────────────────

type GameMode = 'easy' | 'hard';
type GamePhase = 'intro' | 'mode-select' | 'cinematic' | 'showing' | 'playing' | 'won' | 'gameover';
type Theme = 'forest' | 'space' | 'ocean';

interface Cell { row: number; col: number; }
interface LeaderEntry { name: string; time: number; date: string; }

// ── Constants ──────────────────────────────────────────────────────────────

const GRID_COLS = 6;
const GRID_ROWS = 6;

const MODE_CONFIG = {
  easy: { steps: 16, hearts: 3, hints: 3, showDuration: 8 },
  hard: { steps: 20, hearts: 0, hints: 0, showDuration: 5 },
};

const THEME_CONFIG: Record<Theme, {
  label: string; emoji: string; bg: string; gridBg: string;
  pathColor: string; playerColor: string; decoyColor: string;
}> = {
  forest: {
    label: 'ফরেস্ট', emoji: '🌲',
    bg: 'from-green-950 via-emerald-950/60 to-slate-950',
    gridBg: 'bg-emerald-950/40 border-emerald-800/30',
    pathColor: '#22c55e', playerColor: '#86efac', decoyColor: '#854d0e',
  },
  space: {
    label: 'স্পেস', emoji: '🌌',
    bg: 'from-slate-950 via-purple-950/50 to-blue-950',
    gridBg: 'bg-purple-950/40 border-purple-800/30',
    pathColor: '#a855f7', playerColor: '#d8b4fe', decoyColor: '#1e3a8a',
  },
  ocean: {
    label: 'ওশান', emoji: '🌊',
    bg: 'from-blue-950 via-cyan-950/50 to-slate-950',
    gridBg: 'bg-blue-950/40 border-blue-800/30',
    pathColor: '#06b6d4', playerColor: '#67e8f9', decoyColor: '#7c3aed',
  },
};

// ── LocalStorage helpers ───────────────────────────────────────────────────

function getLeaderboard(mode: GameMode): LeaderEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(`maze_lb_${mode}`) || '[]'); } catch { return []; }
}
function saveLeaderboard(mode: GameMode, entry: LeaderEntry) {
  if (typeof window === 'undefined') return;
  try {
    const lb = getLeaderboard(mode);
    lb.push(entry);
    lb.sort((a, b) => a.time - b.time);
    localStorage.setItem(`maze_lb_${mode}`, JSON.stringify(lb.slice(0, 5)));
  } catch {}
}
function getBestTime(mode: GameMode): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const lb = getLeaderboard(mode);
    return lb.length > 0 ? lb[0].time : null;
  } catch { return null; }
}
function getSavedName(): string {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem('maze_player_name') || ''; } catch { return ''; }
}
function saveName(name: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('maze_player_name', name); } catch {}
}
function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'forest';
  try { return (localStorage.getItem('maze_theme') as Theme) || 'forest'; } catch { return 'forest'; }
}
function saveTheme(t: Theme) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('maze_theme', t); } catch {}
}

// ── Path generation ────────────────────────────────────────────────────────

function cellKey(c: Cell) { return `${c.row},${c.col}`; }
function cellEq(a: Cell, b: Cell) { return a.row === b.row && a.col === b.col; }

function getNeighbors(cell: Cell): Cell[] {
  return [[-1, 0], [1, 0], [0, -1], [0, 1]]
    .map(([dr, dc]) => ({ row: cell.row + dr, col: cell.col + dc }))
    .filter(c => c.row >= 0 && c.row < GRID_ROWS && c.col >= 0 && c.col < GRID_COLS);
}

function generatePath(steps: number): Cell[] {
  for (let attempt = 0; attempt < 300; attempt++) {
    const start: Cell = { row: Math.floor(Math.random() * GRID_ROWS), col: Math.floor(Math.random() * GRID_COLS) };
    const path: Cell[] = [start];
    const visited = new Set<string>([cellKey(start)]);
    let current = start;
    let ok = true;
    for (let i = 1; i < steps; i++) {
      const nbrs = getNeighbors(current).filter(c => !visited.has(cellKey(c)));
      if (!nbrs.length) { ok = false; break; }
      const next = nbrs[Math.floor(Math.random() * nbrs.length)];
      path.push(next);
      visited.add(cellKey(next));
      current = next;
    }
    if (ok && path.length === steps) return path;
  }
  // Fallback snake
  const path: Cell[] = [];
  for (let r = 0; r < GRID_ROWS && path.length < steps; r++) {
    const cols = r % 2 === 0 ? Array.from({ length: GRID_COLS }, (_, i) => i) : Array.from({ length: GRID_COLS }, (_, i) => GRID_COLS - 1 - i);
    for (const c of cols) if (path.length < steps) path.push({ row: r, col: c });
  }
  return path;
}

// Generate plausible-looking decoy paths (cells NOT on real path)
function generateDecoys(realPath: Cell[]): Set<string> {
  const realSet = new Set(realPath.map(cellKey));
  const decoys = new Set<string>();
  // Extend from a few real path cells in wrong directions
  const sampleIndices = [Math.floor(realPath.length * 0.2), Math.floor(realPath.length * 0.5), Math.floor(realPath.length * 0.75)];
  for (const idx of sampleIndices) {
    const base = realPath[idx];
    let cur = base;
    for (let d = 0; d < 3; d++) {
      const nbrs = getNeighbors(cur).filter(c => !realSet.has(cellKey(c)) && !decoys.has(cellKey(c)));
      if (!nbrs.length) break;
      const next = nbrs[Math.floor(Math.random() * nbrs.length)];
      decoys.add(cellKey(next));
      cur = next;
    }
  }
  return decoys;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' });
}

function getDirection(from: Cell, to: Cell): string {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (dr === -1) return '↑';
  if (dr === 1) return '↓';
  if (dc === -1) return '←';
  if (dc === 1) return '→';
  return '';
}

// ── Particles ──────────────────────────────────────────────────────────────

function Particles({ theme }: { theme: Theme }) {
  const emojis = theme === 'forest' ? ['✨', '🌿', '🍃'] : theme === 'space' ? ['⭐', '✨', '💫'] : ['🫧', '💧', '✨'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} className="absolute text-sm opacity-0"
          style={{ left: `${(i * 17 + 5) % 95}%`, top: `${(i * 23 + 10) % 90}%`, animation: `floatParticle ${4 + (i % 4)}s ${i * 0.4}s ease-in-out infinite` }}>
          {emojis[i % emojis.length]}
        </div>
      ))}
    </div>
  );
}

// ── Sparkle effect ─────────────────────────────────────────────────────────

function Sparkles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color, top: `${20 + i * 20}%`, left: `${15 + i * 20}%`, animation: `sparkle 0.6s ${i * 0.1}s ease-out forwards` }} />
      ))}
    </div>
  );
}

// ── Confetti ───────────────────────────────────────────────────────────────

function MazeConfetti() {
  const colors = ['#f59e0b', '#ec4899', '#06b6d4', '#22c55e', '#a855f7'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 36 }, (_, i) => (
        <div key={i} className="absolute w-3 h-3 rounded-sm"
          style={{ left: `${(i * 7 + 3) % 96}%`, top: '-12px', backgroundColor: colors[i % colors.length], animation: `confettiFall ${1.5 + (i % 3) * 0.5}s ${i * 0.06}s linear forwards`, transform: `rotate(${i * 30}deg)` }} />
      ))}
    </div>
  );
}

// ── Leaderboard panel ──────────────────────────────────────────────────────

function LeaderboardPanel({ title, entries }: { title: string; entries: LeaderEntry[] }) {
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
      <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
        <Trophy className="w-4 h-4 text-yellow-400" /> {title}
      </h3>
      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <div key={i} className={cn('flex items-center justify-between px-2 py-1.5 rounded-lg text-xs', i === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5')}>
            <div className="flex items-center gap-1.5">
              <span>{medals[i]}</span>
              <span className="text-white font-medium truncate max-w-[80px]">{e.name}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-black text-yellow-400">{formatTime(e.time)}</span>
              <span className="text-slate-500">{formatDate(e.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface Props { onExit: () => void; }

export function BivrantiMazeGame({ onExit }: Props) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [mode, setMode] = useState<GameMode>('easy');
  const [theme, setTheme] = useState<Theme>('forest');
  const [playerName, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [savedName, setSavedName] = useState<string>('');
  const [savedThemeLoaded, setSavedThemeLoaded] = useState(false);

  // Load persisted theme and name after mount (client-only)
  useEffect(() => {
    const t = getSavedTheme();
    if (t !== 'forest') setTheme(t);
    const n = getSavedName();
    if (n) setSavedName(n);
    setSavedThemeLoaded(true);
  }, []);

  const [path, setPath] = useState<Cell[]>([]);
  const [decoys, setDecoys] = useState<Set<string>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [playerPos, setPlayerPos] = useState<Cell>({ row: 0, col: 0 });
  const [stepIndex, setStepIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [showPath, setShowPath] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [doorOpen, setDoorOpen] = useState(false);
  const [sparkleCell, setSparkleCell] = useState<string | null>(null);
  const [halfwayFlashDone, setHalfwayFlashDone] = useState(false);
  const [playerMoving, setPlayerMoving] = useState(false);
  const [exitCelebrating, setExitCelebrating] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);

  const th = THEME_CONFIG[theme];

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase, startTime]);

  // Cinematic reveal phase: reveal cells one by one
  useEffect(() => {
    if (phase !== 'cinematic' || path.length === 0) return;
    setRevealedCells(new Set());
    setDoorOpen(false);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < path.length) {
        setRevealedCells(prev => new Set([...Array.from(prev), cellKey(path[idx])]));
        idx++;
      } else {
        clearInterval(interval);
        // Door opens, then hold full path, then switch to showing countdown
        setDoorOpen(true);
        setTimeout(() => {
          setShowPath(true);
          setPhase('showing');
          setCountdown(MODE_CONFIG[mode].showDuration);
        }, 400);
      }
    }, Math.min(120, (2000 / path.length)));

    return () => clearInterval(interval);
  }, [phase, path, mode]);

  // Countdown during 'showing'
  useEffect(() => {
    if (phase !== 'showing') return;
    if (countdown <= 0) {
      setShowPath(false);
      setRevealedCells(new Set());
      setPhase('playing');
      setStartTime(Date.now());
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Halfway flash during gameplay
  useEffect(() => {
    if (phase !== 'playing' || halfwayFlashDone || path.length === 0) return;
    const halfwayStep = Math.floor(path.length / 2);
    if (stepIndex === halfwayStep) {
      setHalfwayFlashDone(true);
      setShowPath(true);
      setTimeout(() => setShowPath(false), 1000);
    }
  }, [phase, stepIndex, path.length, halfwayFlashDone]);

  useEffect(() => { saveTheme(theme); }, [theme]);

  const startGame = useCallback((m: GameMode) => {
    const newPath = generatePath(MODE_CONFIG[m].steps);
    const newDecoys = generateDecoys(newPath);
    setPath(newPath);
    setDecoys(newDecoys);
    setPlayerPos(newPath[0]);
    setStepIndex(0);
    setHearts(MODE_CONFIG[m].hearts);
    setHintsLeft(MODE_CONFIG[m].hints);
    setHintsUsed(0);
    setHeartsLost(0);
    setElapsed(0);
    setShaking(false);
    setRedFlash(false);
    setHintActive(false);
    setShowPath(false);
    setRevealedCells(new Set());
    setHalfwayFlashDone(false);
    setDoorOpen(false);
    setSparkleCell(null);
    setExitCelebrating(false);
    setMode(m);
    setPhase('cinematic');
  }, []);

  const handleCellTap = useCallback((cell: Cell) => {
    if (phase !== 'playing') return;
    const nextStep = stepIndex + 1;
    if (nextStep >= path.length) return;
    const expected = path[nextStep];

    if (cellEq(cell, expected)) {
      playSound.matchSuccess();
      setPlayerMoving(true);
      setTimeout(() => setPlayerMoving(false), 250);
      setSparkleCell(cellKey(cell));
      setTimeout(() => setSparkleCell(null), 600);
      setPlayerPos(cell);
      setStepIndex(nextStep);

      if (nextStep === path.length - 1) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setFinalTime(elapsed);
        setExitCelebrating(true);
        playSound.winFanfare();
        const prev = getBestTime(mode);
        setIsNewRecord(prev === null || elapsed < prev);
        if (playerName) {
          saveLeaderboard(mode, { name: playerName, time: elapsed, date: new Date().toISOString() });
        }
        setLeaderboard(getLeaderboard(mode));
        setTimeout(() => setPhase('won'), 800);
      }
    } else {
      playSound.errorBuzz();
      setShaking(true);
      setRedFlash(true);
      setTimeout(() => setShaking(false), 600);
      setTimeout(() => setRedFlash(false), 400);

      if (mode === 'hard') {
        setTimeout(() => setPhase('gameover'), 700);
      } else {
        const newHearts = hearts - 1;
        setHearts(newHearts);
        setHeartsLost(h => h + 1);
        if (newHearts <= 0) setTimeout(() => setPhase('gameover'), 700);
      }
    }
  }, [phase, stepIndex, path, hearts, mode, startTime, playerName]);

  const useHint = useCallback(() => {
    if (hintsLeft <= 0 || hintActive || phase !== 'playing') return;
    setHintsLeft(h => h - 1);
    setHintsUsed(h => h + 1);
    setShowPath(true);
    setHintActive(true);
    setTimeout(() => { setShowPath(false); setHintActive(false); }, 2000);
  }, [hintsLeft, hintActive, phase]);

  const calcScore = (): number => {
    if (mode === 'hard') return 10;
    return Math.max(1, Math.min(10, 10 - hintsUsed * 2 - heartsLost));
  };

  const scoreMessage = (s: number): string => {
    if (s === 10) return 'অবিশ্বাস্য! তুমি একটা জিনিয়াস! 🧠🔥';
    if (s >= 8) return 'দারুণ স্মৃতিশক্তি! 🎉';
    if (s >= 6) return 'বেশ ভালো করেছ! 👏';
    return 'চেষ্টা করতে থাকো! 💪';
  };

  const exitKey = path.length > 0 ? cellKey(path[path.length - 1]) : '';
  const playerKey = cellKey(playerPos);

  // ── Intro ──────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const displayName = playerName || savedName;
    return (
      <div className={cn('min-h-screen bg-gradient-to-br relative overflow-hidden pt-20 pb-20', th.bg)}>
        <style>{mazeCSS}</style>
        <Particles theme={theme} />
        <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> ফিরে যাও
          </button>
          <div className="text-center mb-10">
            <div className="text-7xl mb-4" style={{ animation: 'spinSlow 6s linear infinite', display: 'inline-block' }}>🌀</div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ fontFamily: 'var(--font-playfair)', textShadow: `0 0 30px ${th.pathColor}60` }}>
              বিভ্রান্তির গলি
            </h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-sm mx-auto">
              এই গেম তোমার স্মৃতিশক্তি, মনোযোগ ও দ্রুত সিদ্ধান্ত নেওয়ার ক্ষমতা বাড়াবে।
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <p className="text-slate-400 text-xs text-center mb-3">থিম বেছে নাও</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(THEME_CONFIG) as Theme[]).map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className={cn('py-2.5 rounded-xl border text-sm font-bold transition-all', theme === t ? 'border-white/50 bg-white/15 text-white scale-[1.02]' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30')}>
                  {THEME_CONFIG[t].emoji} {THEME_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            {displayName ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">🏃 খেলোয়াড়: <strong className="text-white">{displayName}</strong></span>
                <button onClick={() => { setPlayerName(''); setNameInput(''); setSavedName(''); }} className="text-xs text-slate-500 hover:text-slate-300 underline">পরিবর্তন</button>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 text-sm mb-3 text-center">তোমার নাম লেখো (একবারই লাগবে)</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="নাম..." value={nameInput} onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) { setPlayerName(nameInput.trim()); saveName(nameInput.trim()); setSavedName(nameInput.trim()); } }}
                    className="flex-1 h-11 px-4 rounded-xl border border-white/20 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20" autoFocus />
                  <button onClick={() => { if (nameInput.trim()) { setPlayerName(nameInput.trim()); saveName(nameInput.trim()); setSavedName(nameInput.trim()); } }}
                    disabled={!nameInput.trim()} className="px-4 rounded-xl font-bold text-black disabled:opacity-40 transition-all"
                    style={{ background: `linear-gradient(135deg, ${th.pathColor}, ${th.playerColor})` }}>ঠিক</button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => { if (!playerName && savedName) setPlayerName(savedName); setPhase('mode-select'); }}
            className="w-full h-14 rounded-2xl font-black text-black text-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${th.pathColor}, ${th.playerColor})` }}>
            এখনই খেলুন 🌀
          </button>
        </div>
      </div>
    );
  }

  // ── Mode select ────────────────────────────────────────────────────────
  if (phase === 'mode-select') {
    const easyLb = getLeaderboard('easy');
    const hardLb = getLeaderboard('hard');
    return (
      <div className={cn('min-h-screen bg-gradient-to-br relative overflow-hidden pt-20 pb-20', th.bg)}>
        <style>{mazeCSS}</style>
        <Particles theme={theme} />
        <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6">
          <button onClick={() => setPhase('intro')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> পেছনে
          </button>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🌀</div>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>মোড বেছে নাও</h1>
          </div>
          <div className="grid grid-cols-1 gap-4 mb-8">
            <button onClick={() => startGame('easy')}
              className="p-6 rounded-2xl border-2 border-green-500/40 bg-green-500/10 hover:border-green-400 hover:bg-green-500/20 transition-all text-left hover:scale-[1.02] active:scale-[0.98]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🟢</span>
                {easyLb[0] && <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">সেরা: {formatTime(easyLb[0].time)}</span>}
              </div>
              <h3 className="font-black text-white text-xl mb-1">সহজ মোড</h3>
              <p className="text-slate-300 text-sm">১৬ ধাপ • ৩ জীবন • ৩ হিন্ট • পথ দেখাবে ৮ সেকেন্ড</p>
            </button>
            <button onClick={() => startGame('hard')}
              className="p-6 rounded-2xl border-2 border-red-500/40 bg-red-500/10 hover:border-red-400 hover:bg-red-500/20 transition-all text-left hover:scale-[1.02] active:scale-[0.98]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🔴</span>
                {hardLb[0] && <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">সেরা: {formatTime(hardLb[0].time)}</span>}
              </div>
              <h3 className="font-black text-white text-xl mb-1">কঠিন মোড</h3>
              <p className="text-slate-300 text-sm">२० ধাপ • কোনো জীবন নেই • একটি ভুল = খেলা শেষ • ৫ সেকেন্ড</p>
            </button>
          </div>
          {(easyLb.length > 0 || hardLb.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {easyLb.length > 0 && <LeaderboardPanel title="সহজ টপ ৫" entries={easyLb} />}
              {hardLb.length > 0 && <LeaderboardPanel title="কঠিন টপ ৫" entries={hardLb} />}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Won screen ─────────────────────────────────────────────────────────
  if (phase === 'won') {
    const score = calcScore();
    const msg = scoreMessage(score);
    return (
      <div className={cn('min-h-screen bg-gradient-to-br relative overflow-hidden pt-20 pb-20', th.bg)}>
        <style>{mazeCSS}</style>
        <MazeConfetti />
        <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 text-center">
          <div className="text-7xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>জয়ী!</h1>
          {isNewRecord && <p className="text-yellow-400 font-black text-lg mb-2 animate-pulse">নতুন রেকর্ড! 🏆</p>}
          <p className="text-4xl font-black mb-6" style={{ color: th.pathColor }}>{score}<span className="text-xl text-white/60">/10</span></p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <p className="text-xl font-bold text-white mb-4">{msg}</p>
            <div className="space-y-1 text-sm text-slate-300">
              <p>⏱ সময়: {formatTime(finalTime)}</p>
              <p>📊 মোড: {mode === 'easy' ? 'সহজ' : 'কঠিন'}</p>
              {mode === 'easy' && <>
                <p>💡 হিন্ট ব্যবহার: {hintsUsed}</p>
                <p>❤️ জীবন হারিয়েছ: {heartsLost}</p>
              </>}
            </div>
          </div>
          {leaderboard.length > 0 && <LeaderboardPanel title="শীর্ষ সময়" entries={leaderboard} />}
          <div className="space-y-2 mt-6">
            <button onClick={() => startGame(mode)}
              className="w-full h-12 rounded-xl font-bold text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${th.pathColor}, ${th.playerColor})` }}>
              <RotateCcw className="w-4 h-4" /> আবার খেলো
            </button>
            <button onClick={() => setPhase('mode-select')} className="w-full h-12 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-colors">মোড পরিবর্তন</button>
            <button onClick={onExit} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-300 transition-colors text-sm">খেলায় ফিরুন</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Game over ──────────────────────────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br relative overflow-hidden pt-20 pb-20', th.bg)}>
        <style>{mazeCSS}</style>
        <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 text-center">
          <div className="text-7xl mb-4">💔</div>
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>খেলা শেষ!</h1>
          <p className="text-slate-400 mb-6">{mode === 'hard' ? 'একটি ভুলেই শেষ — কঠিন মোড!' : 'তিনটি জীবনই শেষ হয়ে গেছে!'}</p>
          <div className="space-y-2">
            <button onClick={() => startGame(mode)}
              className="w-full h-12 rounded-xl font-bold text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${th.pathColor}, ${th.playerColor})` }}>
              <RotateCcw className="w-4 h-4" /> আবার চেষ্টা করো
            </button>
            <button onClick={() => setPhase('mode-select')} className="w-full h-12 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-colors">মোড পরিবর্তন</button>
            <button onClick={onExit} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-300 text-sm transition-colors">খেলায় ফিরুন</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Cinematic / Showing / Playing grid screen ──────────────────────────
  const isShowingPhase = phase === 'cinematic' || phase === 'showing';

  return (
    <div className={cn('min-h-screen bg-gradient-to-br relative overflow-hidden pt-20 pb-6', th.bg)}>
      <style>{mazeCSS}</style>
      <Particles theme={theme} />

      {/* Red flash overlay */}
      {redFlash && <div className="fixed inset-0 bg-red-500/25 pointer-events-none z-40" style={{ animation: 'flashRed 0.4s ease-out forwards' }} />}

      <div className={cn('relative z-10 max-w-lg mx-auto px-3 sm:px-6', shaking && 'maze-shake')}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onExit} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> ফিরুন
          </button>
          <button onClick={() => startGame(mode)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> পুনরায়
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-center">
            <div className="text-slate-400 text-xs mb-0.5">সময়</div>
            <div className="font-black text-white text-sm">{formatTime(elapsed)}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-center">
            <div className="text-slate-400 text-xs mb-0.5">ধাপ</div>
            <div className="font-black text-white text-sm">{stepIndex}/{path.length - 1}</div>
          </div>
          {mode === 'easy' ? (
            <>
              <div className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-center">
                <div className="text-slate-400 text-xs mb-0.5">জীবন</div>
                <div className="text-sm leading-none pt-0.5">{Array.from({ length: 3 }).map((_, i) => i < hearts ? '❤️' : '🖤').join('')}</div>
              </div>
              <button onClick={useHint} disabled={hintsLeft <= 0 || hintActive || phase !== 'playing'}
                className={cn('rounded-xl px-2 py-2.5 text-center border transition-all min-h-[44px]',
                  hintsLeft > 0 && !hintActive ? 'border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 active:scale-95' : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed')}>
                <div className="text-slate-400 text-xs mb-0.5">হিন্ট</div>
                <div className="font-black text-yellow-400 text-sm flex items-center justify-center gap-0.5">
                  <Lightbulb className="w-3 h-3" />{hintsLeft}
                </div>
              </button>
            </>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-center col-span-2">
              <div className="text-slate-400 text-xs mb-0.5">মোড</div>
              <div className="font-black text-red-400 text-sm">কঠিন 🔴</div>
            </div>
          )}
        </div>

        {/* Phase banners */}
        {phase === 'cinematic' && (
          <div className="text-center mb-3 py-2 rounded-xl border animate-pulse" style={{ borderColor: th.pathColor + '60', backgroundColor: th.pathColor + '10' }}>
            <p className="font-bold text-sm" style={{ color: th.playerColor }}>🚪 দরজা খুলছে — পথ দেখো!</p>
          </div>
        )}
        {phase === 'showing' && (
          <div className="text-center mb-3 py-2 rounded-xl border border-white/20 bg-white/5">
            <p className="text-white font-bold text-sm">পথটি মনে রাখো! <span className="text-yellow-400">{countdown}s</span></p>
          </div>
        )}
        {hintActive && (
          <div className="text-center mb-3 py-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10">
            <p className="text-yellow-300 font-bold text-sm">হিন্ট সক্রিয়! 👀</p>
          </div>
        )}

        {/* Grid */}
        <div className={cn('rounded-2xl p-2.5 border mb-3', th.gridBg)}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
            {Array.from({ length: GRID_ROWS }, (_, row) =>
              Array.from({ length: GRID_COLS }, (_, col) => {
                const cell: Cell = { row, col };
                const key = cellKey(cell);
                const isPlayer = key === playerKey;
                const isExit = key === exitKey;
                const isRevealedPath = revealedCells.has(key);
                const isVisiblePath = showPath && path.some(c => cellKey(c) === key);
                const pathIdx = path.findIndex(c => cellKey(c) === key);
                const isVisited = pathIdx >= 0 && pathIdx <= stepIndex;
                const isDecoy = decoys.has(key) && (isShowingPhase || showPath);
                const isSparkle = sparkleCell === key;
                const isExitCelebrate = isExit && exitCelebrating;

                let bgColor = 'rgba(255,255,255,0.03)';
                let boxShadow: string | undefined;
                let borderColor = 'rgba(255,255,255,0.08)';
                let scale = '';

                if (isPlayer) {
                  bgColor = th.playerColor + '30';
                  boxShadow = `0 0 18px ${th.playerColor}90, 0 0 8px ${th.playerColor}60`;
                  borderColor = th.playerColor + '80';
                  scale = playerMoving ? 'scale-125' : 'scale-110';
                } else if (isExitCelebrate) {
                  bgColor = '#f59e0b30';
                  boxShadow = `0 0 20px #f59e0b`;
                  borderColor = '#f59e0b80';
                } else if (isExit) {
                  bgColor = th.pathColor + '20';
                  boxShadow = `0 0 10px ${th.pathColor}50`;
                  borderColor = th.pathColor + '60';
                } else if (isRevealedPath || isVisiblePath) {
                  bgColor = th.pathColor + '40';
                  boxShadow = `0 0 12px ${th.pathColor}80, 0 0 4px ${th.pathColor}60`;
                  borderColor = th.pathColor + '90';
                  scale = 'scale-[1.04]';
                } else if (isVisited) {
                  bgColor = th.pathColor + '18';
                  borderColor = th.pathColor + '30';
                } else if (isDecoy) {
                  bgColor = th.decoyColor + '25';
                  borderColor = th.decoyColor + '50';
                }

                const isStart = pathIdx === 0;
                  const isPathEnd = pathIdx === path.length - 1;
                  const showArrow = (isRevealedPath || isVisiblePath) && pathIdx >= 0 && pathIdx < path.length - 1;

                  return (
                  <button
                    key={key}
                    onClick={() => handleCellTap(cell)}
                    disabled={isShowingPhase}
                    className={cn(
                      'aspect-square rounded-lg text-base font-bold border relative overflow-hidden',
                      'min-h-[40px] sm:min-h-[46px]',
                      'transition-all duration-200',
                      scale,
                      !isShowingPhase && !isPlayer && 'hover:border-white/30 active:scale-95',
                    )}
                    style={{
                      backgroundColor: bgColor,
                      boxShadow,
                      borderColor,
                      willChange: 'transform, box-shadow',
                    }}
                  >
                    {isPlayer && (
                      <span className={cn('text-lg leading-none', playerMoving ? 'maze-run' : 'maze-idle')}>🏃</span>
                    )}
                    {!isPlayer && isExit && (
                      <span className={cn('text-base leading-none', isExitCelebrate ? 'maze-door-open' : doorOpen ? 'maze-door-open' : '')}>{isExitCelebrate ? '🎊' : '🚪'}</span>
                    )}
                    {!isPlayer && !isExit && isStart && (isRevealedPath || isVisiblePath) && (
                      <span className="text-xs leading-none">🚀</span>
                    )}
                    {!isPlayer && !isExit && !isStart && showArrow && (
                      <span className="text-sm leading-none" style={{ color: th.playerColor }}>{getDirection(path[pathIdx], path[pathIdx + 1])}</span>
                    )}
                    {isSparkle && <Sparkles color={th.pathColor} />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500 pb-4 flex-wrap">
          <span>🏃 তুমি</span>
          <span>🚪 বের হওয়ার পথ</span>
          {(isShowingPhase || showPath) && <span>🚀 শুরু</span>}
          {(isShowingPhase || showPath) && <span style={{ color: th.playerColor }}>↑↓←→ দিক</span>}
          {(isShowingPhase || showPath) && <span style={{ color: th.pathColor }}>● সঠিক পথ</span>}
          {(isShowingPhase || showPath) && <span style={{ color: th.decoyColor + 'cc' }}>● ফাঁদ</span>}
        </div>
      </div>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────

const mazeCSS = `
@keyframes floatParticle {
  0%, 100% { opacity: 0; transform: translateY(0px) scale(0.8); }
  50% { opacity: 0.6; transform: translateY(-20px) scale(1.1); }
}
@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes flashRed {
  0% { opacity: 0.5; }
  100% { opacity: 0; }
}
@keyframes confettiFall {
  0% { transform: translateY(-12px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
@keyframes sparkle {
  0% { transform: scale(0) translate(0,0); opacity: 1; }
  100% { transform: scale(1.5) translate(var(--sx, 8px), var(--sy, -8px)); opacity: 0; }
}
@keyframes mazeRun {
  0%, 100% { transform: scaleX(1) translateY(0); }
  50% { transform: scaleX(1.1) translateY(-2px); }
}
@keyframes mazeIdle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes doorOpen {
  0% { transform: scaleX(1); }
  50% { transform: scaleX(0.1); }
  100% { transform: scaleX(1); }
}
.maze-run { animation: mazeRun 0.25s ease-in-out; }
.maze-idle { animation: mazeIdle 1.6s ease-in-out infinite; }
.maze-door-open { animation: doorOpen 0.4s ease-in-out; }
.maze-shake { animation: mazeShake 0.5s ease-in-out; }
@keyframes mazeShake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
  90% { transform: translateX(4px); }
}
`;
