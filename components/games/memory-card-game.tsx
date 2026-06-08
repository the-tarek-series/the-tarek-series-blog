'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Crown, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ─── Audio ─────────────────────────────────────────────────────────────────
function useAudio() {
  const ctx = useRef<AudioContext | null>(null);
  function getCtx() {
    if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx.current;
  }
  const play = useCallback((type: 'click' | 'match' | 'wrong' | 'win') => {
    try {
      const ac = getCtx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      if (type === 'click') {
        o.frequency.value = 800; o.type = 'sine';
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
        o.start(); o.stop(ac.currentTime + 0.08);
      } else if (type === 'match') {
        o.frequency.setValueAtTime(523, ac.currentTime);
        o.frequency.setValueAtTime(659, ac.currentTime + 0.1);
        o.frequency.setValueAtTime(784, ac.currentTime + 0.2);
        o.type = 'sine'; g.gain.setValueAtTime(0.2, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
        o.start(); o.stop(ac.currentTime + 0.4);
      } else if (type === 'wrong') {
        o.frequency.setValueAtTime(200, ac.currentTime);
        o.frequency.setValueAtTime(150, ac.currentTime + 0.1);
        o.type = 'sawtooth'; g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
        o.start(); o.stop(ac.currentTime + 0.25);
      } else if (type === 'win') {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
          const o2 = ac.createOscillator(); const g2 = ac.createGain();
          o2.connect(g2); g2.connect(ac.destination);
          o2.frequency.value = f; o2.type = 'sine';
          g2.gain.setValueAtTime(0.2, ac.currentTime + i * 0.12);
          g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.3);
          o2.start(ac.currentTime + i * 0.12);
          o2.stop(ac.currentTime + i * 0.12 + 0.3);
        });
      }
    } catch {}
  }, []);
  return play;
}

// ─── Confetti ───────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: ['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899'][i % 6],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    size: `${6 + Math.random() * 8}px`,
    duration: `${2 + Math.random() * 2}s`,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute top-0 rounded-sm animate-confetti-fall"
          style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color,
            animationDelay: p.delay, animationDuration: p.duration }} />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall { animation: confetti-fall linear forwards; }
      `}</style>
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────
type Level = 'সহজ' | 'মধ্যম' | 'কঠিন';
type Phase = 'name' | 'tutorial' | 'playing' | 'won';

interface Card { uid: string; id: number; value: number; flipped: boolean; matched: boolean; shake: boolean; }
interface ScoreEntry { id: string; player_name: string; score: number; time: number; level: string; stars: number; created_at: string; }

const LEVEL_CFG: Record<Level, { pairs: number; min: number; max: number; cols: string }> = {
  সহজ:   { pairs: 6,  min: 1,    max: 50,   cols: 'grid-cols-4' },
  মধ্যম: { pairs: 8,  min: 100,  max: 999,  cols: 'grid-cols-4' },
  কঠিন:  { pairs: 10, min: 1000, max: 9999, cols: 'grid-cols-5' },
};

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildDeck(level: Level): Card[] {
  const { pairs, min, max } = LEVEL_CFG[level];
  const values: number[] = [];
  while (values.length < pairs) {
    const v = randInt(min, max);
    if (!values.includes(v)) values.push(v);
  }
  const cards: Card[] = [];
  values.forEach((v, i) => {
    cards.push({ uid: `${i}-a`, id: i, value: v, flipped: false, matched: false, shake: false });
    cards.push({ uid: `${i}-b`, id: i, value: v, flipped: false, matched: false, shake: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

function calcStars(elapsed: number): number {
  if (elapsed < 30) return 10;
  if (elapsed < 60) return 9;
  if (elapsed < 90) return 8;
  return 6;
}

function winMessage(stars: number): string {
  if (stars === 10) return 'তুমি একটা জিনিয়াস! 🧠🔥';
  if (stars === 9)  return 'অসাধারণ! প্রায় পারফেক্ট! 🎉';
  if (stars === 8)  return 'বাহ! বেশ ভালো করেছ! 👏';
  return 'চেষ্টা করতে থাকো! 💪';
}

function fmtTime(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

interface Props { onExit: () => void; }

export function MemoryCardGame({ onExit }: Props) {
  const play = useAudio();
  const [phase, setPhase] = useState<Phase>('name');
  const [playerName, setPlayerName] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('nmm_name') || '' : '');
  const [level, setLevel] = useState<Level>('সহজ');
  const [levelLocked, setLevelLocked] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [moves, setMoves] = useState(0);
  const [stars, setStars] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [neverShowTutorial, setNeverShowTutorial] = useState(false);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const skip = typeof window !== 'undefined' && localStorage.getItem('nmm_skip_tutorial') === '1';
    if (!skip) setShowTutorial(true);
  }, []);

  const loadScores = useCallback(async () => {
    const { data } = await supabase.from('game_scores')
      .select('*').eq('game_type', 'number_memory').order('score', { ascending: false }).limit(10);
    if (data) setScores(data as ScoreEntry[]);
  }, []);

  useEffect(() => { loadScores(); }, [loadScores]);

  function startGame() {
    const deck = buildDeck(level);
    setCards(deck);
    setSelected([]);
    setLocked(false);
    setElapsed(0);
    setMoves(0);
    setSaved(false);
    setPhase('playing');
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    play('click');
  }

  function stopTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }

  const flip = useCallback((uid: string) => {
    if (locked || selected.length === 2) return;
    const card = cards.find(c => c.uid === uid);
    if (!card || card.flipped || card.matched) return;
    play('click');
    setCards(prev => prev.map(c => c.uid === uid ? { ...c, flipped: true } : c));
    const newSel = [...selected, uid];
    setSelected(newSel);

    if (newSel.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = newSel.map(u => cards.find(c => c.uid === u)!);
      if (a.id === b.id) {
        play('match');
        setCards(prev => {
          const next = prev.map(c => newSel.includes(c.uid) ? { ...c, matched: true } : c);
          if (next.every(c => c.matched)) {
            stopTimer();
            const s = calcStars(Math.floor((Date.now() - startTimeRef.current) / 1000));
            setStars(s);
            setPhase('won');
            play('win');
            if (level === 'কঠিন') setLevelLocked(true);
          }
          return next;
        });
        setSelected([]);
        setLocked(false);
      } else {
        play('wrong');
        setCards(prev => prev.map(c => newSel.includes(c.uid) ? { ...c, shake: true } : c));
        setTimeout(() => {
          setCards(prev => prev.map(c => newSel.includes(c.uid) ? { ...c, flipped: false, shake: false } : c));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  }, [locked, selected, cards, level, play]);

  async function saveScore() {
    if (!playerName.trim() || saving || saved) return;
    setSaving(true);
    await supabase.from('game_scores').insert({
      player_name: playerName.trim(), score: stars * 10, time: elapsed,
      level, stars, game_type: 'number_memory',
    });
    setSaving(false); setSaved(true);
    await loadScores();
  }

  function dismissTutorial() {
    if (neverShowTutorial && typeof window !== 'undefined') localStorage.setItem('nmm_skip_tutorial', '1');
    setShowTutorial(false);
  }

  const cfg = LEVEL_CFG[level];
  const matchedCount = cards.filter(c => c.matched).length / 2;

  // ── Name entry ──────────────────────────────────────────────────────────
  if (phase === 'name') return (
    <div className="pt-24 pb-20">
      <div className="max-w-md mx-auto px-4">
        <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="w-4 h-4" /> গেমে ফিরুন</button>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-2xl font-bold mb-2">নম্বর মেমোরি ম্যাচ</h1>
          <p className="text-muted-foreground text-sm mb-6">জোড়া সংখ্যা খুঁজে বের করো!</p>
          <input type="text" value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="তোমার নাম লেখো"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-accent/50 text-center"
            onKeyDown={e => e.key === 'Enter' && playerName.trim() && (localStorage.setItem('nmm_name', playerName.trim()), setPhase('playing'), startGame())}
          />
          <div className="flex gap-2 justify-center mb-6">
            {(['সহজ','মধ্যম','কঠিন'] as Level[]).map(l => (
              <button key={l} onClick={() => !levelLocked && setLevel(l)}
                disabled={levelLocked && l !== level}
                className={cn('px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all', level === l ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-muted text-muted-foreground')}>
                {l}
              </button>
            ))}
          </div>
          {levelLocked && (
            <p className="text-xs text-muted-foreground mb-4">কঠিন মোড সম্পন্ন! <button onClick={() => setLevelLocked(false)} className="text-accent underline">মোড পরিবর্তন করুন 🔄</button></p>
          )}
          <Button onClick={() => { if (!playerName.trim()) return; localStorage.setItem('nmm_name', playerName.trim()); startGame(); }}
            disabled={!playerName.trim()}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-base">
            খেলা শুরু করো 🚀
          </Button>
          <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="mt-4 text-sm text-accent hover:underline flex items-center gap-1 mx-auto">
            <Trophy className="w-4 h-4" /> স্কোরবোর্ড দেখো
          </button>
        </div>

        {showLeaderboard && (
          <div className="mt-4 bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> শীর্ষ ১০</h2>
            {scores.length === 0 ? <p className="text-muted-foreground text-sm">এখনও কোনো স্কোর নেই।</p> : (
              <div className="space-y-2">
                {scores.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/40">
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-amber-400 text-white' : i < 3 ? 'bg-slate-400 text-white' : 'bg-muted-foreground/20 text-muted-foreground')}>
                      {i === 0 ? '👑' : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.player_name}{i === 0 && <span className="text-xs text-amber-500 ml-1">তুমিই সেরা! 👑</span>}</p>
                      <p className="text-xs text-muted-foreground">{s.level} · {fmtTime(s.time)}</p>
                    </div>
                    <span className="font-bold text-accent shrink-0">{s.stars}/10 ⭐</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">🎮 কীভাবে খেলবে?</h2>
              <button onClick={dismissTutorial}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground mb-5">
              <p>১. দুটি কার্ড উল্টাও।</p>
              <p>২. যদি দুটি সংখ্যা একই হয় — জোড়া মেলে! ✅</p>
              <p>৩. না হলে কার্ড আবার উল্টে যাবে। ❌</p>
              <p>৪. সব কার্ড মেলাও যত তাড়াতাড়ি পারো।</p>
              <p>৫. কম সময়ে শেষ করলে বেশি স্টার পাবে! ⭐</p>
            </div>
            <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
              <input type="checkbox" checked={neverShowTutorial} onChange={e => setNeverShowTutorial(e.target.checked)} />
              আর দেখাবেন না
            </label>
            <Button onClick={dismissTutorial} className="w-full bg-accent text-white hover:bg-accent/90">বুঝে গেছি! 👍</Button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Won screen ──────────────────────────────────────────────────────────
  if (phase === 'won') return (
    <div className="pt-24 pb-20">
      <Confetti />
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-6xl mb-3">🏆</div>
          <h2 className="text-2xl font-bold mb-1">{winMessage(stars)}</h2>
          <p className="text-muted-foreground text-sm mb-4">{moves} চাল · {fmtTime(elapsed)}</p>
          <div className="text-4xl font-bold text-accent mb-2">{stars}/10 ⭐</div>
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: 10 }).map((_, i) => <span key={i} className={i < stars ? 'text-amber-400' : 'text-muted'}>★</span>)}
          </div>
          {!saved ? (
            <div className="flex gap-2 mb-4">
              <input readOnly value={playerName} className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm" />
              <Button onClick={saveScore} disabled={saving} size="sm" className="bg-accent text-white hover:bg-accent/90 shrink-0">{saving ? '...' : 'সেভ করো'}</Button>
            </div>
          ) : <p className="text-green-600 text-sm mb-4 font-medium">✅ স্কোর সেভ হয়েছে!</p>}
          <div className="flex gap-3">
            <Button onClick={() => { stopTimer(); setPhase('name'); }} variant="outline" className="flex-1">← পেছনে</Button>
            <Button onClick={() => { stopTimer(); startGame(); }} className="flex-1 bg-accent text-white hover:bg-accent/90"><RotateCcw className="w-4 h-4 mr-1" /> আবার খেলো</Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Playing ─────────────────────────────────────────────────────────────
  return (
    <div className="pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { stopTimer(); setPhase('name'); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> ফিরে যাও</button>
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">{level}</span>
            <span className="font-mono font-bold">{fmtTime(elapsed)}</span>
            <span className="text-muted-foreground">{matchedCount}/{cfg.pairs} জোড়া</span>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-1">নম্বর মেমোরি ম্যাচ</h1>
        <p className="text-muted-foreground text-xs mb-4">একই সংখ্যার জোড়া খুঁজে বের করো — {cfg.pairs * 2}টি কার্ড</p>

        <div className={cn('grid gap-2 sm:gap-3', cfg.cols)}>
          {cards.map(card => (
            <button key={card.uid} onClick={() => flip(card.uid)}
              disabled={card.matched || card.flipped || locked}
              className={cn(
                'aspect-square rounded-xl font-bold text-sm sm:text-base transition-all duration-300 border-2 flex items-center justify-center select-none',
                card.matched
                  ? 'bg-green-100 border-green-400 text-green-700 shadow-green-200/50 shadow-md'
                  : card.flipped
                  ? 'bg-card border-accent text-foreground shadow-md scale-105'
                  : 'bg-slate-800 border-slate-700 text-slate-800 hover:bg-slate-700 cursor-pointer',
                card.shake && 'animate-shake'
              )}>
              {card.flipped || card.matched ? card.value : ''}
              {!card.flipped && !card.matched && (
                <span className="text-slate-600 text-lg">◆</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
          <span>চাল: {moves}</span>
          <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="flex items-center gap-1 text-accent">
            <Trophy className="w-3.5 h-3.5" /> স্কোরবোর্ড
          </button>
        </div>

        {showLeaderboard && (
          <div className="mt-3 bg-card border border-border rounded-2xl p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1"><Crown className="w-4 h-4 text-amber-400" /> শীর্ষ স্কোর</h3>
            {scores.slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 py-1 text-xs">
                <span className={cn('w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0', i === 0 ? 'bg-amber-400 text-white' : 'bg-muted text-muted-foreground')}>{i === 0 ? '👑' : i + 1}</span>
                <span className="flex-1 truncate">{s.player_name}</span>
                <span className="text-accent font-bold">{s.stars}/10⭐</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
