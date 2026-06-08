'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Crown, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Each color: the Bengali word and the ink color hex to display it in
const ALL_COLORS = [
  { name: 'লাল',    hex: '#ef4444' },
  { name: 'নীল',    hex: '#3b82f6' },
  { name: 'সবুজ',   hex: '#22c55e' },
  { name: 'হলুদ',   hex: '#eab308' },
  { name: 'বেগুনি', hex: '#a855f7' },
  { name: 'কমলা',   hex: '#f97316' },
];

type Difficulty = 'সহজ' | 'মধ্যম' | 'কঠিন';

const DIFF_CFG: Record<Difficulty, { count: number; showMs: number }> = {
  সহজ:  { count: 3, showMs: 2000 },
  মধ্যম: { count: 4, showMs: 1500 },
  কঠিন:  { count: 5, showMs: 1000 },
};

type Phase = 'start' | 'showing' | 'recall' | 'result' | 'gameover';

interface ColorItem { name: string; hex: string; }
interface LeaderboardEntry { id: string; player_name: string; score: number; level: number; difficulty: string; created_at: string; }

function useAudio() {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback((type: 'correct' | 'wrong' | 'win') => {
    try {
      const ac = ctx.current ?? (ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)());
      const o = ac.createOscillator(); const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      if (type === 'correct') {
        o.frequency.value = 660; o.type = 'sine';
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
        o.start(); o.stop(ac.currentTime + 0.2);
      } else if (type === 'wrong') {
        o.frequency.value = 200; o.type = 'sawtooth';
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
        o.start(); o.stop(ac.currentTime + 0.3);
      } else {
        [523,659,784,1047].forEach((f, i) => {
          const o2 = ac.createOscillator(); const g2 = ac.createGain();
          o2.connect(g2); g2.connect(ac.destination);
          o2.frequency.value = f; o2.type = 'sine';
          g2.gain.setValueAtTime(0.18, ac.currentTime + i * 0.12);
          g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.3);
          o2.start(ac.currentTime + i * 0.12);
          o2.stop(ac.currentTime + i * 0.12 + 0.3);
        });
      }
    } catch {}
  }, []);
}

function Confetti() {
  const pieces = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    color: ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#f97316'][i % 6],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    size: `${6 + Math.random() * 8}px`,
    dur: `${2 + Math.random() * 2}s`,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute top-0 rounded-sm" style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, animation: `cm-fall ${p.dur} ${p.delay} linear forwards` }} />
      ))}
      <style>{`@keyframes cm-fall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

// Generate sequence: word is one color, ink is a DIFFERENT color
function genSequence(count: number): ColorItem[] {
  const seq: ColorItem[] = [];
  for (let i = 0; i < count; i++) {
    const word = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
    let ink: ColorItem;
    do { ink = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]; } while (ink.name === word.name);
    // The display: word text = word.name, ink color = ink.hex
    // Player must recall the ink color name in order
    seq.push({ name: ink.name, hex: ink.hex });
  }
  return seq;
}

interface Props { onExit: () => void; }

export function ColorMemoryGame({ onExit }: Props) {
  const play = useAudio();
  const [difficulty, setDifficulty] = useState<Difficulty>('সহজ');
  const [phase, setPhase] = useState<Phase>('start');
  // sequence holds the ink colors the player must recall
  const [sequence, setSequence] = useState<ColorItem[]>([]);
  // displayWords holds what word text to show (different color name, displayed in sequence[i].hex ink)
  const [displayWords, setDisplayWords] = useState<string[]>([]);
  const [recallInput, setRecallInput] = useState<ColorItem[]>([]);
  const [showSeqIdx, setShowSeqIdx] = useState<number>(-1); // which word is currently shown (-1 = all visible together)
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLB, setShowLB] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const cfg = DIFF_CFG[difficulty];

  const loadLB = useCallback(async () => {
    const { data } = await supabase.from('game_scores').select('*')
      .eq('game_type', 'color_memory').order('score', { ascending: false }).limit(10);
    if (data) setLeaderboard(data);
  }, []);

  useEffect(() => { loadLB(); }, [loadLB]);

  function buildRound() {
    const seq = genSequence(cfg.count);
    // For display words: pick word text different from the ink color
    const words = seq.map(inkColor => {
      let wordColor: ColorItem;
      do { wordColor = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]; } while (wordColor.name === inkColor.name);
      return wordColor.name;
    });
    setSequence(seq);
    setDisplayWords(words);
    setRecallInput([]);
    return seq;
  }

  function startRound() {
    const seq = buildRound();
    setPhase('showing');
    setShowSeqIdx(-1);
    // Show all together for showMs, then hide
    const hideTimer = setTimeout(() => {
      setPhase('recall');
    }, cfg.showMs);
    return () => clearTimeout(hideTimer);
  }

  function startGame() {
    setLevel(1);
    setScore(0);
    setLives(3);
    setSaved(false);
    setShowConfetti(false);
    buildRound();
    setPhase('showing');
    const hideTimer = setTimeout(() => setPhase('recall'), cfg.showMs);
    return () => clearTimeout(hideTimer);
  }

  // When player taps a color button during recall
  function handleRecall(color: ColorItem) {
    if (phase !== 'recall') return;
    const pos = recallInput.length;
    const correct = sequence[pos];
    const newInput = [...recallInput, color];
    setRecallInput(newInput);

    if (color.name !== correct.name) {
      // Wrong
      play('wrong');
      setFlash('wrong');
      setTimeout(() => setFlash(null), 600);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setPhase('gameover');
      } else {
        // Retry same sequence
        setTimeout(() => {
          setRecallInput([]);
          setPhase('showing');
          setTimeout(() => setPhase('recall'), cfg.showMs);
        }, 1000);
      }
      return;
    }

    // Correct so far
    if (newInput.length === sequence.length) {
      // Completed round!
      play('win');
      setFlash('correct');
      setTimeout(() => setFlash(null), 600);
      const pts = level * cfg.count * 10;
      const newScore = score + pts;
      setScore(newScore);
      setLevel(l => l + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setPhase('result');
    } else {
      play('correct');
    }
  }

  async function saveScore() {
    if (!playerName.trim() || saving || saved) return;
    setSaving(true);
    await supabase.from('game_scores').insert({ player_name: playerName.trim(), score, level, difficulty, game_type: 'color_memory' });
    setSaving(false); setSaved(true);
    loadLB();
  }

  const diffColors: Record<Difficulty, string> = {
    সহজ: 'border-green-400 bg-green-100 text-green-700',
    মধ্যম: 'border-yellow-400 bg-yellow-100 text-yellow-700',
    কঠিন: 'border-red-400 bg-red-100 text-red-700',
  };

  // ── Start screen ─────────────────────────────────────────────────────────────
  if (phase === 'start') return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-lg mx-auto px-4">
        <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"><ArrowLeft className="w-4 h-4" /> গেমে ফিরুন</button>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-400" />
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎨</div>
            <h1 className="text-2xl font-bold mb-2">রঙ মেমরি</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              রঙিন বাংলা শব্দ দেখানো হবে — <strong>কালির রঙ</strong> মনে রাখো এবং সঠিক ক্রমে বলো!
            </p>

            {/* Example preview */}
            <div className="bg-muted/40 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-muted-foreground mb-2 font-medium">উদাহরণ — কালির রঙ মনে রাখো:</p>
              <div className="flex gap-3 flex-wrap">
                {[{ word: 'সবুজ', hex: '#3b82f6' }, { word: 'লাল', hex: '#22c55e' }, { word: 'নীল', hex: '#eab308' }].map((ex, i) => (
                  <span key={i} className="text-2xl font-bold" style={{ color: ex.hex }}>{ex.word}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">উত্তর: নীল → সবুজ → হলুদ (কালির রঙ অনুযায়ী)</p>
            </div>

            <h2 className="font-semibold text-sm mb-3 text-left">কঠিনতা বেছে নাও:</h2>
            <div className="flex gap-2 mb-6">
              {(Object.keys(DIFF_CFG) as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all', difficulty === d ? diffColors[d] : 'border-border bg-muted text-muted-foreground hover:border-accent/30')}>
                  {d}
                  <div className="text-xs font-normal opacity-70">{DIFF_CFG[d].count} শব্দ</div>
                </button>
              ))}
            </div>

            <Button onClick={startGame} className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-90 text-white font-bold text-base transition-opacity">
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
            {leaderboard.length === 0 ? <p className="text-muted-foreground text-sm">এখনও কোনো স্কোর নেই।</p> : (
              <div className="space-y-2">
                {leaderboard.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-amber-400 text-white' : i < 3 ? 'bg-slate-400 text-white' : 'bg-muted-foreground/20 text-muted-foreground')}>{i === 0 ? '👑' : i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{e.player_name}</p>
                      <p className="text-xs text-muted-foreground">{e.difficulty} · পর্যায় {e.level}</p>
                    </div>
                    <span className="font-bold text-pink-600">{e.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Game Over ─────────────────────────────────────────────────────────────────
  if (phase === 'gameover') return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-400" />
          <div className="p-8">
            <div className="text-5xl mb-3">💔</div>
            <h2 className="text-2xl font-bold mb-1">গেম শেষ!</h2>
            <p className="text-muted-foreground mb-1">পর্যায় {level} পর্যন্ত পৌঁছেছ</p>
            <p className="text-4xl font-bold text-pink-600 mb-6">{score} pts</p>
            {!saved ? (
              <div className="flex gap-2 mb-5 max-w-xs mx-auto">
                <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
                  placeholder="তোমার নাম লেখো"
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                  onKeyDown={e => e.key === 'Enter' && saveScore()} />
                <Button onClick={saveScore} disabled={saving || !playerName.trim()} size="sm" className="bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:opacity-90 shrink-0">
                  {saving ? '...' : 'সেভ'}
                </Button>
              </div>
            ) : <p className="text-green-600 text-sm mb-5 font-medium">✅ স্কোর সেভ হয়েছে!</p>}
            <div className="flex gap-3">
              <Button onClick={() => setPhase('start')} variant="outline" className="flex-1">← পেছনে</Button>
              <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:opacity-90">
                <RotateCcw className="w-4 h-4 mr-1" /> আবার খেলো
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Result (round won) ─────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-slate-950 dark:to-slate-900">
      {showConfetti && <Confetti />}
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-400" />
          <div className="p-8">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold mb-1">দারুণ!</h2>
            <p className="text-muted-foreground text-sm mb-4">পর্যায় {level - 1} শেষ করেছ</p>
            <p className="text-4xl font-bold text-pink-600 mb-6">{score} pts</p>
            <Button onClick={() => {
              buildRound();
              setPhase('showing');
              setTimeout(() => setPhase('recall'), cfg.showMs);
            }} className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:opacity-90 font-bold text-base">
              পরের পর্যায় →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Showing / Recall ───────────────────────────────────────────────────────────
  return (
    <div className={cn('pt-20 pb-20 min-h-screen transition-colors', flash === 'correct' ? 'bg-green-50 dark:bg-green-950/20' : flash === 'wrong' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-slate-950 dark:to-slate-900')}>
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setPhase('start')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> ফিরে যাও
          </button>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-pink-600">{score} pts</span>
            <span className="text-muted-foreground">পর্যায় {level}</span>
            <div className="flex gap-0.5">{Array.from({ length: 3 }).map((_, i) => <span key={i} className={i < lives ? 'text-red-500' : 'text-muted-foreground/30'}>❤️</span>)}</div>
          </div>
        </div>

        {/* Phase indicator */}
        <div className="text-center mb-6">
          {phase === 'showing' ? (
            <div className="flex items-center justify-center gap-2 text-pink-600 font-medium">
              <Eye className="w-5 h-5 animate-pulse" />
              <span>কালির রঙ মনে রাখো!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-accent font-medium">
              <EyeOff className="w-5 h-5" />
              <span>এখন সঠিক ক্রমে কালির রঙ বলো</span>
            </div>
          )}
        </div>

        {/* Sequence display */}
        <div className={cn('bg-card border-2 rounded-2xl p-6 mb-6 shadow-sm transition-all', flash === 'correct' ? 'border-green-400' : flash === 'wrong' ? 'border-red-400' : 'border-border')}>
          {phase === 'showing' ? (
            <div className="flex flex-wrap gap-4 justify-center">
              {sequence.map((inkColor, i) => (
                <span key={i} className="text-3xl sm:text-4xl font-bold transition-all" style={{ color: inkColor.hex }}>
                  {displayWords[i]}
                </span>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground text-center mb-4">
                {recallInput.length + 1} নম্বর রঙ বেছে নাও ({recallInput.length}/{sequence.length})
              </p>
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-4">
                {sequence.map((_, i) => (
                  <div key={i} className={cn('w-3 h-3 rounded-full transition-all', i < recallInput.length ? 'bg-green-500' : i === recallInput.length ? 'bg-pink-500 animate-pulse' : 'bg-muted')} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Color buttons — always visible during showing AND recall */}
        <div className="grid grid-cols-3 gap-3">
          {ALL_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => handleRecall(color)}
              disabled={phase !== 'recall'}
              className={cn(
                'py-4 rounded-xl text-white text-base font-bold transition-all active:scale-95 border-2 border-transparent',
                phase === 'recall' ? 'hover:brightness-110 cursor-pointer hover:border-white/40' : 'opacity-70 cursor-default'
              )}
              style={{ backgroundColor: color.hex }}
            >
              {color.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
