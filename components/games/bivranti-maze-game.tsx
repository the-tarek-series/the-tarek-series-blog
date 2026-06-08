'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Trophy, Crown, RotateCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ─── Audio ───────────────────────────────────────────────────────────────────
function useAudio() {
  const ctx = useRef<AudioContext | null>(null);
  function getCtx() {
    if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx.current;
  }
  return useCallback((type: 'correct' | 'wrong' | 'win' | 'hint') => {
    try {
      const ac = getCtx();
      const o = ac.createOscillator(); const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      if (type === 'correct') {
        o.frequency.value = 660; o.type = 'sine';
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
        o.start(); o.stop(ac.currentTime + 0.2);
      } else if (type === 'wrong') {
        o.frequency.value = 180; o.type = 'sawtooth';
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
        o.start(); o.stop(ac.currentTime + 0.3);
      } else if (type === 'hint') {
        o.frequency.value = 880; o.type = 'sine';
        g.gain.setValueAtTime(0.1, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
        o.start(); o.stop(ac.currentTime + 0.15);
      } else {
        [523, 659, 784, 1047].forEach((f, i) => {
          const o2 = ac.createOscillator(); const g2 = ac.createGain();
          o2.connect(g2); g2.connect(ac.destination);
          o2.frequency.value = f; o2.type = 'sine';
          g2.gain.setValueAtTime(0.18, ac.currentTime + i * 0.13);
          g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.13 + 0.3);
          o2.start(ac.currentTime + i * 0.13); o2.stop(ac.currentTime + i * 0.13 + 0.3);
        });
      }
    } catch {}
  }, []);
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: ['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7'][i % 5],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    size: `${6 + Math.random() * 8}px`,
    dur: `${2 + Math.random() * 2}s`,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute top-0 rounded-sm" style={{
          left: p.left, width: p.size, height: p.size, backgroundColor: p.color,
          animation: `maze-fall ${p.dur} ${p.delay} linear forwards`
        }} />
      ))}
      <style>{`@keyframes maze-fall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

// ─── Types & Config ───────────────────────────────────────────────────────────
type Dir = '→' | '←' | '↑' | '↓';
type Theme = 'বন' | 'মহাকাশ' | 'সমুদ্র';
type Difficulty = 'সহজ' | 'কঠিন';

const THEMES: Record<Theme, { bg: string; path: string; char: string; end: string; emoji: string }> = {
  বন:      { bg: 'bg-green-50 dark:bg-green-950',    path: 'bg-green-200 dark:bg-green-800', char: '🏃', end: '🚪', emoji: '🌲' },
  মহাকাশ: { bg: 'bg-slate-900',                      path: 'bg-slate-700',                  char: '🚀', end: '🌟', emoji: '🌌' },
  সমুদ্র: { bg: 'bg-blue-50 dark:bg-blue-950',       path: 'bg-blue-200 dark:bg-blue-800',  char: '🐠', end: '🏝️',  emoji: '🌊' },
};

const DIFF_CFG: Record<Difficulty, { steps: number; hearts: number; hints: number; showMs: number }> = {
  সহজ:  { steps: 16, hearts: 3, hints: 3, showMs: 8000 },
  কঠিন: { steps: 20, hearts: 0, hints: 0, showMs: 5000 },
};

const DIRS: Dir[] = ['→', '←', '↑', '↓'];
const GRID = 5; // 5×5 visible grid

function genPath(steps: number): Dir[] {
  return Array.from({ length: steps }, () => DIRS[Math.floor(Math.random() * DIRS.length)]);
}

function calcScore(hints: number, heartsLost: number, difficulty: Difficulty): number {
  if (difficulty === 'কঠিন') return 10;
  let s = 10;
  s -= hints * 2;
  s -= heartsLost;
  return Math.max(0, s);
}

function winMsg(score: number): string {
  if (score === 10) return 'তুমি একটা জিনিয়াস! 🧠🔥';
  if (score >= 8)   return 'অসাধারণ! প্রায় পারফেক্ট! 🎉';
  if (score >= 6)   return 'বাহ! বেশ ভালো করেছ! 👏';
  return 'চেষ্টা করতে থাকো! 💪';
}

interface ScoreEntry { id: string; player_name: string; score: number; level: string; created_at: string; }
interface Props { onExit: () => void; }

export function BivrantiMazeGame({ onExit }: Props) {
  const play = useAudio();
  const [phase, setPhase] = useState<'name' | 'countdown' | 'playing' | 'won' | 'dead'>('name');
  const [playerName, setPlayerName] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('maze_name') || '' : '');
  const [difficulty, setDifficulty] = useState<Difficulty>('সহজ');
  const [theme, setTheme] = useState<Theme>('বন');
  const [path, setPath] = useState<Dir[]>([]);
  const [step, setStep] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);
  const [pathVisible, setPathVisible] = useState(true);
  const [hintFlash, setHintFlash] = useState(false);
  const [shakePath, setShakePath] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [showLB, setShowLB] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const cfg = DIFF_CFG[difficulty];

  const loadScores = useCallback(async () => {
    const { data } = await supabase.from('game_scores')
      .select('*').eq('game_type', 'maze_bivranti').order('score', { ascending: false }).limit(10);
    if (data) setScores(data as ScoreEntry[]);
  }, []);

  useEffect(() => { loadScores(); }, [loadScores]);

  function startGame() {
    const p = genPath(cfg.steps);
    setPath(p); setStep(0); setHearts(cfg.hearts); setHintsLeft(cfg.hints);
    setHintsUsed(0); setHeartsLost(0); setPathVisible(true); setSaved(false);
    setShowConfetti(false); setCountdown(3); setPhase('countdown');
  }

  // Countdown → show path → hide path → playing
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    // countdown done: show path
    setPathVisible(true);
    const hideTimer = setTimeout(() => {
      setPathVisible(false);
      setPhase('playing');
    }, cfg.showMs);
    return () => clearTimeout(hideTimer);
  }, [phase, countdown, cfg.showMs]);

  function handleDir(dir: Dir) {
    if (phase !== 'playing') return;
    const expected = path[step];
    if (dir === expected) {
      play('correct');
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep >= path.length) {
        const score = calcScore(hintsUsed, heartsLost, difficulty);
        play('win');
        setPhase('won');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    } else {
      play('wrong');
      setRedFlash(true); setShakePath(true);
      setTimeout(() => { setRedFlash(false); setShakePath(false); }, 600);
      if (difficulty === 'কঠিন') {
        // no hearts → instant dead
        setPhase('dead');
      } else {
        const newH = hearts - 1;
        setHearts(newH);
        setHeartsLost(l => l + 1);
        if (newH <= 0) setPhase('dead');
      }
    }
  }

  function useHint() {
    if (hintsLeft <= 0 || phase !== 'playing') return;
    play('hint');
    setHintsLeft(h => h - 1);
    setHintsUsed(u => u + 1);
    setHintFlash(true);
    setPathVisible(true);
    setTimeout(() => { setPathVisible(false); setHintFlash(false); }, 2000);
  }

  async function saveScore() {
    const score = calcScore(hintsUsed, heartsLost, difficulty);
    if (!playerName.trim() || saving || saved) return;
    setSaving(true);
    await supabase.from('game_scores').insert({
      player_name: playerName.trim(), score, level: difficulty, game_type: 'maze_bivranti',
    });
    setSaving(false); setSaved(true);
    await loadScores();
  }

  const t = THEMES[theme];
  const score = calcScore(hintsUsed, heartsLost, difficulty);

  // ── Name screen ────────────────────────────────────────────────────────────
  if (phase === 'name') return (
    <div className="pt-24 pb-20">
      <div className="max-w-md mx-auto px-4">
        <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="w-4 h-4" /> গেমে ফিরুন</button>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="text-5xl mb-3">🌀</div>
          <h1 className="text-2xl font-bold mb-1">বিভ্রান্তির গলি</h1>
          <p className="text-muted-foreground text-sm mb-5">পথ মনে রাখো, তারপর এগিয়ে যাও!</p>
          <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
            placeholder="তোমার নাম লেখো"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-accent/50 text-center" />

          <div className="flex gap-2 justify-center mb-3">
            {(['সহজ','কঠিন'] as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={cn('px-5 py-2 rounded-xl text-sm font-medium border-2 transition-all', difficulty === d ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-muted text-muted-foreground')}>
                {d}
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-center mb-5">
            {(['বন','মহাকাশ','সমুদ্র'] as Theme[]).map(th => (
              <button key={th} onClick={() => setTheme(th)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all', theme === th ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-muted text-muted-foreground')}>
                {THEMES[th].emoji} {th}
              </button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground mb-5 space-y-1">
            <p>পদক্ষেপ: {cfg.steps} · হৃদয়: {cfg.hearts || '০'} · ইঙ্গিত: {cfg.hints || '০'} · পথ দেখার সময়: {cfg.showMs / 1000}s</p>
          </div>

          <Button onClick={() => { if (!playerName.trim()) return; localStorage.setItem('maze_name', playerName.trim()); startGame(); }}
            disabled={!playerName.trim()} className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold">
            খেলা শুরু করো 🚀
          </Button>
          <button onClick={() => setShowLB(!showLB)} className="mt-3 text-sm text-accent hover:underline flex items-center gap-1 mx-auto">
            <Trophy className="w-4 h-4" /> স্কোরবোর্ড
          </button>
        </div>

        {showLB && (
          <div className="mt-4 bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> শীর্ষ ১০</h2>
            {scores.length === 0 ? <p className="text-muted-foreground text-sm">এখনও কোনো স্কোর নেই।</p> : (
              <div className="space-y-2">
                {scores.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/40">
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-amber-400 text-white' : 'bg-muted-foreground/20 text-muted-foreground')}>
                      {i === 0 ? '👑' : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.player_name}</p>
                      <p className="text-xs text-muted-foreground">{s.level}</p>
                    </div>
                    <span className="font-bold text-accent">{s.score}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (phase === 'countdown' && countdown > 0) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-40">
      <div className="text-center">
        <div className="text-8xl font-bold text-accent animate-pulse mb-4">{countdown}</div>
        <p className="text-muted-foreground">পথ মনে রাখো!</p>
      </div>
    </div>
  );

  // ── Won ────────────────────────────────────────────────────────────────────
  if (phase === 'won') return (
    <div className="pt-24 pb-20">
      {showConfetti && <Confetti />}
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold mb-2">{winMsg(score)}</h2>
          <div className="text-4xl font-bold text-accent mb-1">{score}/10</div>
          <p className="text-muted-foreground text-sm mb-5">{difficulty} · ইঙ্গিত ব্যবহার: {hintsUsed} · হৃদয় হারিয়েছ: {heartsLost}</p>
          {!saved ? (
            <div className="flex gap-2 mb-4">
              <input readOnly value={playerName} className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm" />
              <Button onClick={saveScore} disabled={saving} size="sm" className="bg-accent text-white hover:bg-accent/90 shrink-0">{saving ? '...' : 'সেভ করো'}</Button>
            </div>
          ) : <p className="text-green-600 text-sm mb-4">✅ সেভ হয়েছে!</p>}
          <div className="flex gap-3">
            <Button onClick={() => setPhase('name')} variant="outline" className="flex-1">← পেছনে</Button>
            <Button onClick={startGame} className="flex-1 bg-accent text-white hover:bg-accent/90"><RotateCcw className="w-4 h-4 mr-1" /> আবার খেলো</Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Dead ────────────────────────────────────────────────────────────────────
  if (phase === 'dead') return (
    <div className="pt-24 pb-20">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-5xl mb-3">💀</div>
          <h2 className="text-2xl font-bold mb-2">গেম ওভার!</h2>
          <p className="text-muted-foreground mb-5">{step}/{path.length} পদক্ষেপ সঠিক ছিল</p>
          <div className="flex gap-3">
            <Button onClick={() => setPhase('name')} variant="outline" className="flex-1">← পেছনে</Button>
            <Button onClick={startGame} className="flex-1 bg-accent text-white hover:bg-accent/90"><RotateCcw className="w-4 h-4 mr-1" /> আবার চেষ্টা করো</Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Show path phase (after countdown=0) ───────────────────────────────────
  const isShowingPath = (phase === 'countdown' && countdown === 0) || pathVisible;

  // ── Playing + path-show ────────────────────────────────────────────────────
  return (
    <div className="pt-20 pb-20">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setPhase('name')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> ফিরে যাও</button>
          <div className="flex items-center gap-3 text-sm">
            {difficulty === 'সহজ' && (
              <>
                <span>{Array.from({ length: 3 }).map((_, i) => <span key={i} className={i < hearts ? 'text-red-500' : 'text-muted-foreground/30'}>❤️</span>)}</span>
                <button onClick={useHint} disabled={hintsLeft <= 0} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs', hintsLeft > 0 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
                  <Lightbulb className="w-3.5 h-3.5" /> ইঙ্গিত ({hintsLeft})
                </button>
              </>
            )}
            <span className="text-xs text-muted-foreground">{step}/{path.length}</span>
          </div>
        </div>

        <h1 className="text-lg font-bold mb-1 flex items-center gap-2">বিভ্রান্তির গলি <span className="text-sm">{THEMES[theme].emoji}</span></h1>

        {/* Path display */}
        <div className={cn('rounded-2xl p-4 mb-4 border transition-all', t.bg, isShowingPath || hintFlash ? 'border-accent' : 'border-border', redFlash && 'border-red-500 bg-red-50 dark:bg-red-950/30', shakePath && 'animate-maze-shake')}>
          {isShowingPath || hintFlash ? (
            <div>
              <p className="text-xs text-center text-muted-foreground mb-2 font-medium">{hintFlash ? '💡 ইঙ্গিত — পথ মনে রাখো!' : '👀 পথ দেখো ও মনে রাখো!'}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {path.map((d, i) => (
                  <div key={i} className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold border', i === step ? 'bg-accent text-white border-accent' : i < step ? 'bg-green-200 border-green-400 text-green-700' : t.path, 'border-border/50')}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-3xl mb-1">{redFlash ? '❌' : t.char}</p>
              <p className="text-xs text-muted-foreground">পদক্ষেপ {step + 1} — কোন দিকে?</p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                {path.slice(0, step).map((d, i) => (
                  <div key={i} className="w-6 h-6 rounded bg-green-200 text-green-700 flex items-center justify-center text-xs">{d}</div>
                ))}
                <div className="w-6 h-6 rounded bg-accent/20 border border-accent text-accent flex items-center justify-center text-xs">?</div>
                {path.slice(step + 1).map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded bg-muted text-muted-foreground flex items-center justify-center text-xs">·</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Direction buttons */}
        {phase === 'playing' && !isShowingPath && (
          <div className="grid grid-cols-3 gap-3 max-w-[200px] mx-auto">
            <div />
            <button onClick={() => handleDir('↑')} className="h-14 rounded-xl bg-card border-2 border-border hover:border-accent hover:bg-accent/10 text-2xl font-bold transition-all active:scale-95">↑</button>
            <div />
            <button onClick={() => handleDir('←')} className="h-14 rounded-xl bg-card border-2 border-border hover:border-accent hover:bg-accent/10 text-2xl font-bold transition-all active:scale-95">←</button>
            <button disabled className="h-14 rounded-xl bg-muted flex items-center justify-center text-lg opacity-50">{t.char}</button>
            <button onClick={() => handleDir('→')} className="h-14 rounded-xl bg-card border-2 border-border hover:border-accent hover:bg-accent/10 text-2xl font-bold transition-all active:scale-95">→</button>
            <div />
            <button onClick={() => handleDir('↓')} className="h-14 rounded-xl bg-card border-2 border-border hover:border-accent hover:bg-accent/10 text-2xl font-bold transition-all active:scale-95">↓</button>
            <div />
          </div>
        )}
      </div>
      <style>{`
        @keyframes maze-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)} }
        .animate-maze-shake { animation: maze-shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
