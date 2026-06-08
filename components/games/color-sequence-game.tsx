'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Trophy, Crown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ─── Audio ──────────────────────────────────────────────────────────────────
function useAudio() {
  const ctx = useRef<AudioContext | null>(null);
  function getCtx() {
    if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx.current;
  }
  return useCallback((type: 'correct' | 'wrong' | 'win' | 'tick') => {
    try {
      const ac = getCtx();
      const o = ac.createOscillator(); const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      if (type === 'correct') {
        o.frequency.setValueAtTime(660, ac.currentTime); o.frequency.setValueAtTime(880, ac.currentTime + 0.1);
        o.type = 'sine'; g.gain.setValueAtTime(0.18, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
        o.start(); o.stop(ac.currentTime + 0.25);
      } else if (type === 'wrong') {
        o.frequency.setValueAtTime(220, ac.currentTime); o.type = 'sawtooth';
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
        o.start(); o.stop(ac.currentTime + 0.3);
      } else if (type === 'win') {
        [523, 659, 784, 1047].forEach((f, i) => {
          const o2 = ac.createOscillator(); const g2 = ac.createGain();
          o2.connect(g2); g2.connect(ac.destination);
          o2.frequency.value = f; o2.type = 'sine';
          g2.gain.setValueAtTime(0.18, ac.currentTime + i * 0.13);
          g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.13 + 0.3);
          o2.start(ac.currentTime + i * 0.13); o2.stop(ac.currentTime + i * 0.13 + 0.3);
        });
      } else {
        o.frequency.value = 440; o.type = 'sine'; g.gain.setValueAtTime(0.06, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
        o.start(); o.stop(ac.currentTime + 0.05);
      }
    } catch {}
  }, []);
}

// ─── Confetti ────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: ['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899'][i % 6],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.2}s`,
    size: `${6 + Math.random() * 7}px`,
    dur: `${2 + Math.random() * 2}s`,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute top-0 rounded-sm" style={{
          left: p.left, width: p.size, height: p.size, backgroundColor: p.color,
          animation: `stroop-fall ${p.dur} ${p.delay} linear forwards`
        }} />
      ))}
      <style>{`@keyframes stroop-fall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

// ─── Config ──────────────────────────────────────────────────────────────────
const ALL_COLORS = [
  { name: 'লাল',    ink: '#ef4444' },
  { name: 'নীল',    ink: '#3b82f6' },
  { name: 'হলুদ',   ink: '#eab308' },
  { name: 'সবুজ',   ink: '#22c55e' },
  { name: 'বেগুনি', ink: '#a855f7' },
  { name: 'কমলা',   ink: '#f97316' },
];

type Difficulty = 'সহজ' | 'মধ্যম' | 'কঠিন';
const DIFF_CFG: Record<Difficulty, { colors: number; thinkMs: number }> = {
  সহজ:   { colors: 4, thinkMs: 2000 },
  মধ্যম: { colors: 6, thinkMs: 1500 },
  কঠিন:  { colors: 6, thinkMs: 1000 },
};

const TOTAL_Q = 10;

interface Question { word: string; wordColor: string; inkIdx: number; options: string[]; }
interface ScoreEntry { id: string; player_name: string; score: number; level: string; created_at: string; }

function genQuestion(difficulty: Difficulty): Question {
  const { colors } = DIFF_CFG[difficulty];
  const pool = ALL_COLORS.slice(0, colors);
  const wordIdx = Math.floor(Math.random() * pool.length);
  let inkIdx = Math.floor(Math.random() * pool.length);
  while (inkIdx === wordIdx) inkIdx = Math.floor(Math.random() * pool.length);
  const word = pool[wordIdx].name;
  const inkColor = pool[inkIdx].ink;
  // 4 options: always include correct ink color name, shuffle rest
  const correct = pool[inkIdx].name;
  const others = pool.filter((_, i) => i !== inkIdx).map(c => c.name).sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [correct, ...others].sort(() => Math.random() - 0.5);
  return { word, wordColor: inkColor, inkIdx, options };
}

function winMsg(score: number): string {
  if (score === 10) return 'তুমি একটা জিনিয়াস! 🧠🔥';
  if (score >= 8)  return 'অসাধারণ! প্রায় পারফেক্ট! 🎉';
  if (score >= 6)  return 'বাহ! বেশ ভালো করেছ! 👏';
  return 'চেষ্টা করতে থাকো! 💪';
}

interface Props { onExit: () => void; }

export function ColorSequenceGame({ onExit }: Props) {
  const play = useAudio();
  const [phase, setPhase] = useState<'name' | 'playing' | 'won'>('name');
  const [playerName, setPlayerName] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('stroop_name') || '' : '');
  const [difficulty, setDifficulty] = useState<Difficulty>('সহজ');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [showLB, setShowLB] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadScores = useCallback(async () => {
    const { data } = await supabase.from('game_scores')
      .select('*').eq('game_type', 'stroop_color').order('score', { ascending: false }).limit(10);
    if (data) setScores(data as ScoreEntry[]);
  }, []);

  useEffect(() => { loadScores(); }, [loadScores]);

  function startGame() {
    const qs = Array.from({ length: TOTAL_Q }, () => genQuestion(difficulty));
    setQuestions(qs); setQIdx(0); setScore(0); setChosen(null); setSaved(false); setShowConfetti(false);
    setTimeLeft(DIFF_CFG[difficulty].thinkMs / 1000);
    setPhase('playing');
  }

  const advance = useCallback((qs: Question[], idx: number, sc: number) => {
    setChosen(null);
    if (idx + 1 >= TOTAL_Q) {
      setScore(sc);
      setPhase('won');
      play('win');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } else {
      setQIdx(idx + 1);
      setTimeLeft(DIFF_CFG[difficulty].thinkMs / 1000);
    }
  }, [difficulty, play]);

  useEffect(() => {
    if (phase !== 'playing' || chosen !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) {
          clearInterval(timerRef.current!);
          play('wrong');
          setTimeout(() => advance(questions, qIdx, score), 600);
          return 0;
        }
        return Math.max(0, t - 0.1);
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, qIdx, chosen, advance, questions, score, play]);

  function choose(option: string) {
    if (chosen !== null || phase !== 'playing') return;
    if (timerRef.current) clearInterval(timerRef.current);
    setChosen(option);
    const q = questions[qIdx];
    const correctName = ALL_COLORS[q.inkIdx]?.name || ALL_COLORS.find(c => c.ink === q.wordColor)?.name;
    const isCorrect = option === correctName;
    const newScore = score + (isCorrect ? 1 : 0);
    play(isCorrect ? 'correct' : 'wrong');
    setScore(newScore);
    setTimeout(() => advance(questions, qIdx, newScore), 900);
  }

  async function saveScore() {
    if (!playerName.trim() || saving || saved) return;
    setSaving(true);
    await supabase.from('game_scores').insert({
      player_name: playerName.trim(), score, level: difficulty, game_type: 'stroop_color',
    });
    setSaving(false); setSaved(true);
    await loadScores();
  }

  const cfg = DIFF_CFG[difficulty];
  const q = questions[qIdx];

  // ── Name entry ────────────────────────────────────────────────────────────
  if (phase === 'name') return (
    <div className="pt-24 pb-20">
      <div className="max-w-md mx-auto px-4">
        <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="w-4 h-4" /> গেমে ফিরুন</button>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="text-5xl mb-3">🌈</div>
          <h1 className="text-2xl font-bold mb-1">বিভ্রান্তির রঙ</h1>
          <p className="text-muted-foreground text-sm mb-2">Stroop Effect — কালির রঙ দেখো, শব্দ নয়!</p>
          <div className="bg-muted/50 rounded-xl p-3 mb-5 text-sm">
            <p>উদাহরণ: <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1.1em' }}>হলুদ</span></p>
            <p className="text-muted-foreground text-xs mt-1">উত্তর: নীল (কালির রঙ)</p>
          </div>
          <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
            placeholder="তোমার নাম লেখো"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-accent/50 text-center" />
          <div className="flex gap-2 justify-center mb-5">
            {(['সহজ','মধ্যম','কঠিন'] as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={cn('px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all', difficulty === d ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-muted text-muted-foreground')}>
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-4">রঙ: {cfg.colors}টি · সময়: {cfg.thinkMs / 1000}s প্রতি প্রশ্ন</p>
          <Button onClick={() => { if (!playerName.trim()) return; localStorage.setItem('stroop_name', playerName.trim()); startGame(); }}
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

  // ── Won ───────────────────────────────────────────────────────────────────
  if (phase === 'won') return (
    <div className="pt-24 pb-20">
      {showConfetti && <Confetti />}
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-2xl font-bold mb-2">{winMsg(score)}</h2>
          <div className="text-5xl font-bold text-accent mb-1">{score}/10</div>
          <p className="text-muted-foreground text-sm mb-5">{difficulty} মোড</p>
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

  // ── Playing ───────────────────────────────────────────────────────────────
  if (!q) return null;
  const correctName = ALL_COLORS[q.inkIdx]?.name;
  const thinkSecs = cfg.thinkMs / 1000;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setPhase('name')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> ফিরে যাও</button>
          <span className="text-sm text-muted-foreground">{qIdx + 1} / {TOTAL_Q}</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          {/* Timer bar */}
          <div className="w-full h-2 bg-muted rounded-full mb-5 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all ease-linear', timeLeft / thinkSecs > 0.4 ? 'bg-accent' : 'bg-red-500')}
              style={{ width: `${Math.max(0, (timeLeft / thinkSecs) * 100)}%`, transition: 'width 0.1s linear' }} />
          </div>

          <p className="text-muted-foreground text-xs mb-2 text-center">কালির রঙ কোনটি?</p>
          <div className="text-center mb-8">
            <span className="text-5xl font-bold" style={{ color: q.wordColor }}>{q.word}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {q.options.map(option => {
              const colorObj = ALL_COLORS.find(c => c.name === option);
              let btnClass = 'bg-muted border-2 border-transparent hover:border-accent text-foreground';
              if (chosen !== null) {
                if (option === correctName) btnClass = 'bg-green-100 border-2 border-green-500 text-green-700';
                else if (option === chosen) btnClass = 'bg-red-100 border-2 border-red-400 text-red-700';
                else btnClass = 'bg-muted border-2 border-transparent opacity-50 text-muted-foreground';
              }
              return (
                <button key={option} onClick={() => choose(option)} disabled={chosen !== null}
                  className={cn('py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2', btnClass)}>
                  {colorObj && <span className="w-4 h-4 rounded-full inline-block shrink-0" style={{ backgroundColor: colorObj.ink }} />}
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>স্কোর: <strong className="text-accent">{score}</strong></span>
          <span className={cn('font-mono font-bold', timeLeft < 1 ? 'text-red-500' : '')}>{timeLeft.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
