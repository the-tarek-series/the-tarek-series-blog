'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Trophy, Crown, RotateCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ─── Audio ────────────────────────────────────────────────────────────────────
function useAudio() {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback((type: 'correct' | 'wrong' | 'win' | 'hint') => {
    try {
      const ac = ctx.current ?? (ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)());
      const o = ac.createOscillator(); const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      if (type === 'correct') {
        o.frequency.value = 660; o.type = 'sine';
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
        o.start(); o.stop(ac.currentTime + 0.18);
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
          o2.start(ac.currentTime + i * 0.13);
          o2.stop(ac.currentTime + i * 0.13 + 0.3);
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
        <div key={p.id} className="absolute top-0 rounded-sm" style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, animation: `mz-fall ${p.dur} ${p.delay} linear forwards` }} />
      ))}
      <style>{`@keyframes mz-fall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Dir = '→' | '←' | '↑' | '↓';
type Theme = 'বন' | 'মহাকাশ' | 'সমুদ্র';

const THEMES: Record<Theme, { gradient: string; pathBg: string; char: string; end: string; emoji: string; textColor: string }> = {
  বন:      { gradient: 'from-emerald-600 to-green-500',  pathBg: 'bg-emerald-100 dark:bg-emerald-900', char: '🏃', end: '🚪', emoji: '🌲', textColor: 'text-emerald-700' },
  মহাকাশ: { gradient: 'from-slate-700 to-blue-900',       pathBg: 'bg-slate-700',                      char: '🚀', end: '🌟', emoji: '🌌', textColor: 'text-blue-300' },
  সমুদ্র: { gradient: 'from-blue-500 to-cyan-400',        pathBg: 'bg-blue-100 dark:bg-blue-900',       char: '🐠', end: '🏝️',  emoji: '🌊', textColor: 'text-blue-700' },
};

// Easy mode only: 8 steps, 3 hearts, 3 hints, 10s show time
const STEPS = 8;
const HEARTS = 3;
const HINTS = 3;
const SHOW_MS = 10000; // 10 seconds

function genPath(): Dir[] {
  const dirs: Dir[] = ['→', '←', '↑', '↓'];
  return Array.from({ length: STEPS }, () => dirs[Math.floor(Math.random() * dirs.length)]);
}

function calcScore(hints: number, heartsLost: number): number {
  return Math.max(0, 10 - hints * 2 - heartsLost);
}

function winMsg(score: number): string {
  if (score === 10) return 'তুমি একটা জিনিয়াস! 🧠🔥';
  if (score >= 8)   return 'অসাধারণ! প্রায় পারফেক্ট! 🎉';
  if (score >= 6)   return 'বাহ! বেশ ভালো করেছ! 👏';
  return 'চেষ্টা করতে থাকো! 💪';
}

interface ScoreEntry { id: string; player_name: string; score: number; created_at: string; }
interface Props { onExit: () => void; }

export function BivrantiMazeGame({ onExit }: Props) {
  const play = useAudio();
  const [phase, setPhase] = useState<'intro' | 'countdown' | 'showing' | 'playing' | 'won' | 'dead'>('intro');
  const [theme, setTheme] = useState<Theme>('বন');
  const [path, setPath] = useState<Dir[]>([]);
  const [step, setStep] = useState(0);
  const [hearts, setHearts] = useState(HEARTS);
  const [hintsLeft, setHintsLeft] = useState(HINTS);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);
  const [hintActive, setHintActive] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [shakePad, setShakePad] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showTimer, setShowTimer] = useState(SHOW_MS);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [showLB, setShowLB] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadScores = useCallback(async () => {
    const { data } = await supabase.from('game_scores')
      .select('*').eq('game_type', 'maze_bivranti').order('score', { ascending: false }).limit(10);
    if (data) setScores(data as ScoreEntry[]);
  }, []);

  useEffect(() => { loadScores(); }, [loadScores]);

  function startGame() {
    const p = genPath();
    setPath(p); setStep(0); setHearts(HEARTS); setHintsLeft(HINTS);
    setHintsUsed(0); setHeartsLost(0); setHintActive(false);
    setSaved(false); setShowConfetti(false);
    setCountdown(3); setShowTimer(SHOW_MS);
    setPhase('countdown');
  }

  // Countdown 3→2→1→0
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    // Countdown done → show path with 10s timer
    setPhase('showing');
    setShowTimer(SHOW_MS);
  }, [phase, countdown]);

  // 10s show timer countdown
  useEffect(() => {
    if (phase !== 'showing') return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setShowTimer(t => {
        if (t <= 100) {
          clearInterval(timerRef.current!);
          setPhase('playing');
          return 0;
        }
        return t - 100;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  function handleDir(dir: Dir) {
    if (phase !== 'playing' && !hintActive) return;
    if (hintActive) return; // buttons disabled during hint flash
    if (phase !== 'playing') return;
    const expected = path[step];
    if (dir === expected) {
      play('correct');
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep >= path.length) {
        play('win');
        setPhase('won');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    } else {
      play('wrong');
      setRedFlash(true); setShakePad(true);
      setTimeout(() => { setRedFlash(false); setShakePad(false); }, 600);
      const newH = hearts - 1;
      setHearts(newH);
      setHeartsLost(l => l + 1);
      if (newH <= 0) setPhase('dead');
    }
  }

  function useHint() {
    if (hintsLeft <= 0 || phase !== 'playing' || hintActive) return;
    play('hint');
    setHintsLeft(h => h - 1);
    setHintsUsed(u => u + 1);
    setHintActive(true);
    setTimeout(() => setHintActive(false), 2500);
  }

  async function saveScore() {
    const score = calcScore(hintsUsed, heartsLost);
    if (!playerName.trim() || saving || saved) return;
    setSaving(true);
    await supabase.from('game_scores').insert({ player_name: playerName.trim(), score, level: 'সহজ', game_type: 'maze_bivranti' });
    setSaving(false); setSaved(true);
    loadScores();
  }

  const th = THEMES[theme];
  const score = calcScore(hintsUsed, heartsLost);
  const timerPct = (showTimer / SHOW_MS) * 100;

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md mx-auto px-4">
        <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"><ArrowLeft className="w-4 h-4" /> গেমে ফিরুন</button>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">🌀</div>
            <h1 className="text-2xl font-bold mb-1">বিভ্রান্তির গলি</h1>
            <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
              ১০ সেকেন্ড পথ দেখো ও মনে রাখো — তারপর ধাপে ধাপে অনুসরণ করো!
            </p>

            <div className="bg-muted/40 rounded-xl p-4 mb-5 text-left text-xs text-muted-foreground space-y-1">
              <p>🎯 {STEPS}টি পদক্ষেপ মনে রাখতে হবে</p>
              <p>⏱️ ১০ সেকেন্ড পথ দেখার সময়</p>
              <p>❤️ ৩টি জীবন, ৩টি ইঙ্গিত</p>
            </div>

            <h2 className="font-semibold text-sm mb-3 text-left">থিম বেছে নাও:</h2>
            <div className="flex gap-2 justify-center mb-6">
              {(['বন','মহাকাশ','সমুদ্র'] as Theme[]).map(th => (
                <button key={th} onClick={() => setTheme(th)}
                  className={cn('flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all', theme === th ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-muted text-muted-foreground')}>
                  {THEMES[th].emoji} {th}
                </button>
              ))}
            </div>

            <Button onClick={startGame} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-white font-bold text-base transition-opacity">
              খেলা শুরু করো 🚀
            </Button>
            <button onClick={() => setShowLB(!showLB)} className="mt-4 text-sm text-accent hover:underline flex items-center gap-1 mx-auto transition-colors">
              <Trophy className="w-4 h-4" /> লিডারবোর্ড দেখো
            </button>
          </div>
        </div>

        {showLB && (
          <div className="mt-4 bg-card border border-border rounded-2xl p-5 shadow">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> শীর্ষ ১০</h2>
            {scores.length === 0 ? <p className="text-muted-foreground text-sm">এখনও কোনো স্কোর নেই।</p> : (
              <div className="space-y-2">
                {scores.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-amber-400 text-white' : 'bg-muted-foreground/20 text-muted-foreground')}>{i === 0 ? '👑' : i + 1}</span>
                    <span className="flex-1 text-sm truncate font-medium">{s.player_name}</span>
                    <span className="font-bold text-emerald-600">{s.score}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Countdown ──────────────────────────────────────────────────────────────
  if (phase === 'countdown') return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-500 z-40">
      <div className="text-center">
        <div className="text-9xl font-bold text-white drop-shadow-lg animate-pulse mb-4">{countdown}</div>
        <p className="text-white/80 text-xl">পথ মনে রাখতে প্রস্তুত হও!</p>
      </div>
    </div>
  );

  // ── Won ────────────────────────────────────────────────────────────────────
  if (phase === 'won') return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-slate-950 dark:to-slate-900">
      {showConfetti && <Confetti />}
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="p-8">
            <div className="text-5xl mb-3">{THEMES[theme].end}</div>
            <h2 className="text-2xl font-bold mb-2">{winMsg(score)}</h2>
            <div className="text-4xl font-bold text-emerald-600 mb-1">{score}/10</div>
            <p className="text-muted-foreground text-sm mb-5">ইঙ্গিত ব্যবহার: {hintsUsed} · হৃদয় হারিয়েছ: {heartsLost}</p>
            {!saved ? (
              <div className="flex gap-2 mb-4 max-w-xs mx-auto">
                <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
                  placeholder="তোমার নাম লেখো"
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  onKeyDown={e => e.key === 'Enter' && saveScore()} />
                <Button onClick={saveScore} disabled={saving || !playerName.trim()} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:opacity-90 shrink-0">
                  {saving ? '...' : 'সেভ'}
                </Button>
              </div>
            ) : <p className="text-green-600 text-sm mb-4">✅ সেভ হয়েছে!</p>}
            <div className="flex gap-3">
              <Button onClick={() => setPhase('intro')} variant="outline" className="flex-1">← পেছনে</Button>
              <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:opacity-90">
                <RotateCcw className="w-4 h-4 mr-1" /> আবার খেলো
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Dead ────────────────────────────────────────────────────────────────────
  if (phase === 'dead') return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-red-50/30 to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-400" />
          <div className="p-8">
            <div className="text-5xl mb-3">💀</div>
            <h2 className="text-2xl font-bold mb-2">গেম ওভার!</h2>
            <p className="text-muted-foreground mb-5">{step}/{path.length} পদক্ষেপ সঠিক ছিল</p>
            <div className="flex gap-3">
              <Button onClick={() => setPhase('intro')} variant="outline" className="flex-1">← পেছনে</Button>
              <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:opacity-90">
                <RotateCcw className="w-4 h-4 mr-1" /> আবার চেষ্টা
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Showing / Playing ──────────────────────────────────────────────────────
  return (
    <div className={cn('pt-20 pb-20 min-h-screen transition-colors duration-300', redFlash ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gradient-to-br from-emerald-50/30 to-teal-50/20 dark:from-slate-950 dark:to-slate-900')}>
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setPhase('intro')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> ফিরে যাও
          </button>
          <div className="flex items-center gap-3 text-sm">
            {/* Hearts */}
            <div className="flex gap-0.5">{Array.from({ length: HEARTS }).map((_, i) => <span key={i} className={cn('transition-all', i < hearts ? 'text-red-500' : 'text-muted-foreground/30')}>❤️</span>)}</div>
            {/* Hint button */}
            <button onClick={useHint} disabled={hintsLeft <= 0 || phase !== 'playing' || hintActive}
              className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all', hintsLeft > 0 && phase === 'playing' && !hintActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60')}>
              <Lightbulb className="w-3.5 h-3.5" /> ইঙ্গিত ({hintsLeft})
            </button>
            <span className="text-xs font-mono text-muted-foreground">{step}/{STEPS}</span>
          </div>
        </div>

        <h1 className="text-lg font-bold mb-3 flex items-center gap-2">
          বিভ্রান্তির গলি <span>{THEMES[theme].emoji}</span>
        </h1>

        {/* Path display box */}
        <div className={cn('rounded-2xl p-4 mb-4 border-2 transition-all', redFlash ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : hintActive ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : phase === 'showing' ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border bg-card', shakePad && 'animate-maze-shake')}>

          {phase === 'showing' && (
            <>
              {/* 10s countdown timer bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="font-medium text-emerald-600">👀 পথ মনে রাখো!</span>
                  <span className="font-mono">{(showTimer / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-100" style={{ width: `${timerPct}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {path.map((d, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                    {d}
                  </div>
                ))}
              </div>
            </>
          )}

          {(phase === 'playing' && !hintActive) && (
            <div className="text-center py-2">
              <p className="text-4xl mb-2">{redFlash ? '❌' : THEMES[theme].char}</p>
              <p className="text-sm text-muted-foreground">পদক্ষেপ {step + 1} — কোন দিকে?</p>
              {/* Progress */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {path.slice(0, step).map((d, i) => (
                  <div key={i} className="w-7 h-7 rounded-lg bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">{d}</div>
                ))}
                <div className="w-7 h-7 rounded-lg bg-accent/20 border-2 border-accent text-accent flex items-center justify-center text-sm font-bold">?</div>
                {path.slice(step + 1).map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center text-xs">·</div>
                ))}
              </div>
            </div>
          )}

          {hintActive && (
            <div>
              <p className="text-xs text-center text-amber-600 font-medium mb-2">💡 ইঙ্গিত — পথ মনে রাখো!</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {path.map((d, i) => (
                  <div key={i} className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold border', i < step ? 'bg-green-200 border-green-400 text-green-700' : i === step ? 'bg-accent text-white border-accent' : 'bg-amber-100 border-amber-300 text-amber-700')}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Direction pad — shown only during playing */}
        {phase === 'playing' && !hintActive && (
          <div className="grid grid-cols-3 gap-3 max-w-[220px] mx-auto">
            <div />
            <button onClick={() => handleDir('↑')} className="h-16 rounded-xl bg-card border-2 border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-2xl font-bold transition-all active:scale-95 shadow-sm">↑</button>
            <div />
            <button onClick={() => handleDir('←')} className="h-16 rounded-xl bg-card border-2 border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-2xl font-bold transition-all active:scale-95 shadow-sm">←</button>
            <div className="h-16 rounded-xl bg-muted flex items-center justify-center text-2xl opacity-80">{THEMES[theme].char}</div>
            <button onClick={() => handleDir('→')} className="h-16 rounded-xl bg-card border-2 border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-2xl font-bold transition-all active:scale-95 shadow-sm">→</button>
            <div />
            <button onClick={() => handleDir('↓')} className="h-16 rounded-xl bg-card border-2 border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-2xl font-bold transition-all active:scale-95 shadow-sm">↓</button>
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
